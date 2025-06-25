
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Send, Loader2, Mic, Ear, Square, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { voiceToTextConversion } from "@/ai/flows/voice-to-text-conversion";
import { recognizeCommand } from "@/ai/flows/command-recognition";
import { cn } from "@/lib/utils";

const emailSchema = z.object({
  to: z.string().email({ message: "Invalid email address." }),
  subject: z.string().min(1, { message: "Subject is required." }),
  body: z.string().min(1, { message: "Email body cannot be empty." }),
});

type CompositionStep = "recipient" | "subject" | "body" | "done" | null;

export default function ComposePage() {
  const [isSending, setIsSending] = React.useState(false);
  const [step, setStep] = React.useState<CompositionStep>(null);
  const [isListening, setIsListening] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false); // Combined transcription and command recognition

  const { toast } = useToast();
  const { play, stop: stopSpeech, isPlaying } = useTextToSpeech();
  const searchParams = useSearchParams();
  
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { to: "", subject: "", body: "" },
  });
  const { setValue, handleSubmit, reset, getValues, trigger } = form;

  const handleTranscription = (field: "to" | "subject" | "body", text: string) => {
    const sanitizedText = text.replace(/(\r\n|\n|\r)/gm, "").trim();
    if (field === 'body') {
      setValue(field, getValues("body") + sanitizedText + " ", { shouldValidate: true });
    } else {
      setValue(field, sanitizedText, { shouldValidate: true });
    }
  };

  const onSubmit = React.useCallback(async (data: z.infer<typeof emailSchema>) => {
    setIsSending(true);
    play("Sending email...");
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSending(false);
    toast({ title: "Email Sent!", description: `Email to ${data.to} sent.` });
    play("Email sent successfully.");
    reset({ to: "", subject: "", body: "" });
    setStep(null);
  }, [reset, toast, play]);

  // Functions are defined before they are used in other callbacks to avoid initialization errors.
  const handleProofread = React.useCallback(async () => {
    stopSpeech();
    const isValid = await trigger();
    if (!isValid) {
      play("There are some errors in the form. Please check the fields.");
      return;
    }
    const { to, subject, body } = getValues();
    const proofreadText = `This email is to: ${to}. The subject is: ${subject}. The body is: ${body || 'The body is empty.'} Would you like to send it?`;
    play(proofreadText, () => {
      // After proofreading, listen for the "send" command.
      // We are deliberately not including startListening in the dependency array
      // to break the circular dependency between handleProofread and startListening.
      // This is safe because startListening will be defined by the time this callback runs.
      startListening('done');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getValues, play, stopSpeech, trigger]);

  const startListening = React.useCallback(async (currentStep: CompositionStep) => {
    if (!currentStep || currentStep === 'done') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      
      mediaRecorderRef.current.onstop = async () => {
        setIsListening(false);
        if (!step) return;
    
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];
    
        mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
    
        if (audioBlob.size < 200) { // Increased threshold
          setIsProcessing(false);
          const prompts: Record<CompositionStep & string, string> = { recipient: "I didn't catch that. Who is the recipient?", subject: "Sorry, what is the subject?", body: "I'm listening for the body of the email." };
          play(prompts[step], () => startListening(step));
          return;
        }
    
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const commandResult = await recognizeCommand({ audioDataUri: base64Audio, currentPath: '/compose' });
            
            switch(commandResult.command) {
              case 'action_send':
                handleSubmit(onSubmit)();
                break;
              case 'action_proofread_email':
                handleProofread();
                break;
              case 'action_help':
                 play("You are composing an email. Speak to fill the current field. You can also say 'proofread email' to hear a draft, or 'send email' to send it.");
                break;
              case 'unknown':
                // If command is unknown, assume it's dictation for the current field
                const { transcription } = await voiceToTextConversion({ audioDataUri: base64Audio });
                handleTranscription(step, transcription);
                if (step === 'recipient') setStep('subject');
                else if (step === 'subject') setStep('body');
                // Don't auto-advance from body
                break;
              default:
                // A valid command was received but not applicable to this page
                 play(`Sorry, the command ${commandResult.command.replace(/_/g, ' ')} is not available here. Please dictate the content for the current field.`);
                 startListening(step);
            }
          } catch (error) {
            console.error("Processing failed:", error);
            toast({ variant: "destructive", title: "Processing Failed", description: "I had trouble understanding. Let's try that again." });
            startListening(step);
          } finally {
            setIsProcessing(false);
            if (step !== 'body' && step !== 'done') { // Keep listening for body
                 startListening(step);
            }
          }
        };
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      // Let user stop recording manually for body, but timeout for others
      if(step === 'recipient' || step === 'subject') {
        setTimeout(() => {
           if (mediaRecorderRef.current?.state === 'recording') {
              mediaRecorderRef.current.stop();
           }
        }, 5000); // Record for up to 5 seconds
      }
    } catch (err) {
      console.error("Mic error:", err);
      toast({ variant: "destructive", title: "Microphone Access Denied" });
      setStep(null);
    }
  }, [step, play, toast, handleSubmit, getValues, setValue, handleProofread, onSubmit]);

  const stopListening = React.useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  
  React.useEffect(() => {
    const prompts: Record<CompositionStep & string, string> = {
      recipient: "Who is the recipient?",
      subject: "What is the subject?",
      body: "Please dictate the body of the email. Press the microphone button when you are finished.",
      done: "Email ready. You can make changes, say 'proofread email', or say 'send email'."
    };
    if (step && prompts[step] && !isPlaying) {
      play(prompts[step], () => {
          if (step !== 'done' && step !== 'body') {
              startListening(step);
          }
      });
    }
  }, [step, play, startListening, isPlaying]);

  // Handle pre-filled form on load, but don't start voice flow
  React.useEffect(() => {
    const to = searchParams.get("to");
    const subject = searchParams.get("subject");
    const body = searchParams.get("body");

    let isPreFilled = false;
    if (to) { setValue("to", to); isPreFilled = true; }
    if (subject) { setValue("subject", subject); isPreFilled = true; }
    if (body) { setValue("body", body); isPreFilled = true; }

    if (isPreFilled) {
      trigger(); // Validate pre-filled fields
      play("Email draft ready. You can make changes, say 'proofread email' or say 'send email'.");
      setStep('done');
    }

    return () => { // Cleanup on unmount
      stopSpeech();
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isInteracting = isListening || isProcessing || isPlaying;
  const currentField: CompositionStep = isListening || isProcessing ? step : null;

  const getFieldStatusIcon = (field: CompositionStep) => {
      if (currentField === field) {
          return isListening ? <Mic className="h-5 w-5 text-destructive animate-pulse" /> : <Loader2 className="h-5 w-5 animate-spin" />;
      }
      if (getValues(field as "to" | "subject" | "body")) {
          return <FileText className="h-5 w-5 text-green-500" />;
      }
      return <Ear className="h-5 w-5 text-muted-foreground" />;
  }
  
  const handleDictationButtonClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setStep('body');
      startListening('body');
    }
  }

  return (
    <div className="p-4 md:p-6">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              Compose Email
              {isInteracting && (
                  <div className="flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-muted text-muted-foreground">
                      {isListening && <><Mic className="h-4 w-4 animate-pulse" />Listening...</>}
                      {isProcessing && <><Loader2 className="h-4 w-4 animate-spin" />Processing...</>}
                      {isPlaying && <><Ear className="h-4 w-4" />Speaking...</>}
                  </div>
              )}
            </div>
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setStep('recipient')} 
                disabled={isInteracting || !!step}
              >
                <Ear className="mr-2 h-4 w-4" />
                Compose by Voice
            </Button>
          </CardTitle>
          <CardDescription>
            You can type your email manually or use the &quot;Compose by Voice&quot; button to start a guided dictation session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input placeholder="recipient@example.com" {...field} className={cn(currentField === 'recipient' && 'border-primary ring-2 ring-primary')} />
                      </FormControl>
                      {getFieldStatusIcon('recipient')}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input placeholder="Email subject" {...field} className={cn(currentField === 'subject' && 'border-primary ring-2 ring-primary')} />
                      </FormControl>
                      {getFieldStatusIcon('subject')}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body</FormLabel>
                    <div className="flex items-start gap-2">
                      <FormControl>
                        <Textarea placeholder="Dictate your email, or use the microphone button below..." className={cn("min-h-[200px] resize-y", currentField === 'body' && 'border-primary ring-2 ring-primary')} {...field} />
                      </FormControl>
                       {getFieldStatusIcon('body')}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <Button type="submit" disabled={isSending || isInteracting} size="lg" className="w-full sm:w-auto">
                  {isSending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                  ) : (
                    <><Send className="mr-2 h-4 w-4" />Send Email</>
                  )}
                </Button>
                 <Button type="button" variant="outline" onClick={handleProofread} disabled={isInteracting} size="lg" className="w-full sm:w-auto">
                    <FileText className="mr-2 h-4 w-4" />
                    Proofread
                </Button>
                <div className="flex-1 flex justify-center sm:justify-end">
                   <Button 
                        type="button" 
                        onClick={handleDictationButtonClick} 
                        disabled={isProcessing || isPlaying || !step}
                        size="icon"
                        className={cn("w-16 h-16 rounded-full transition-colors", isListening ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90' )}
                        title={!step ? "Start 'Compose by Voice' flow to enable body dictation" : "Dictate Email Body"}
                    >
                       {isListening ? <Square className="h-7 w-7 fill-white" /> : <Mic className="h-7 w-7" />}
                    </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
