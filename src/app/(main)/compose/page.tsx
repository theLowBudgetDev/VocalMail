"use client";

import * as React from "react";
import { Send, Loader2, Mic, Ear } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [isTranscribing, setIsTranscribing] = React.useState(false);

  const { toast } = useToast();
  const { play, stop: stopSpeech, isPlaying } = useTextToSpeech();
  
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { to: "", subject: "", body: "" },
  });
  const { setValue, handleSubmit, reset, getValues } = form;

  const handleTranscription = (field: "to" | "subject" | "body", text: string) => {
    const sanitizedText = text.replace(/(\r\n|\n|\r)/gm, "").trim();
    if (field === 'body') {
      setValue(field, getValues("body") + sanitizedText + " ", { shouldValidate: true });
    } else {
      setValue(field, sanitizedText, { shouldValidate: true });
    }
  };

  const startListening = React.useCallback(async (currentStep: CompositionStep) => {
    if (!currentStep || currentStep === 'done') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      
      mediaRecorderRef.current.onstop = async () => {
        setIsListening(false);
        if (!step) return;
    
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];
    
        mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
    
        if (audioBlob.size < 100) { // Check for empty or very short recording
          setIsTranscribing(false);
          const prompts = { recipient: "I didn't catch that. Who is the recipient?", subject: "Sorry, what is the subject?", body: "I'm listening for the body of the email." };
          play(prompts[step], () => startListening(step));
          return;
        }
    
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const { transcription } = await voiceToTextConversion({ audioDataUri: base64Audio });
            handleTranscription(step, transcription);
            
            if (step === 'recipient') setStep('subject');
            else if (step === 'subject') setStep('body');
            else if (step === 'body') setStep('done');
    
          } catch (error) {
            console.error("Transcription failed:", error);
            toast({ variant: "destructive", title: "Transcription Failed" });
            play("Sorry, I had trouble understanding. Let's try that again.", () => startListening(step));
          } finally {
            setIsTranscribing(false);
          }
        };
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      setTimeout(() => {
         if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
         }
      }, 7000); // Record for up to 7 seconds
    } catch (err) {
      console.error("Mic error:", err);
      toast({ variant: "destructive", title: "Microphone Access Denied" });
      setStep(null);
    }
  }, [step, play, toast, handleTranscription]);
  
  React.useEffect(() => {
    const prompts: Record<CompositionStep & string, string> = {
      recipient: "Who is the recipient?",
      subject: "What is the subject?",
      body: "Please dictate the body of the email.",
      done: "Email ready. You can make changes or say 'send email' using the global voice command."
    };
    if (step && prompts[step]) {
      play(prompts[step], () => {
          if (step !== 'done') {
              startListening(step);
          }
      });
    }
  }, [step, play, startListening]);

  // Start the process on page load
  React.useEffect(() => {
    play("New email.", () => setStep('recipient'));
    return () => { // Cleanup on unmount
      stopSpeech();
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const onSubmit = React.useCallback(async (data: z.infer<typeof emailSchema>) => {
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSending(false);
    toast({ title: "Email Sent!", description: `Email to ${data.to} sent.` });
    play("Email sent successfully.", () => setStep(null));
    reset();
  }, [reset, toast, play]);

  React.useEffect(() => {
    const handleCommand = (event: CustomEvent) => {
      if (event.detail.command === 'action_send') handleSubmit(onSubmit)();
    };
    window.addEventListener('voice-command', handleCommand as EventListener);
    return () => window.removeEventListener('voice-command', handleCommand as EventListener);
  }, [handleSubmit, onSubmit]);

  const isInteracting = isListening || isTranscribing || isPlaying;
  const currentField: CompositionStep = isListening || isTranscribing ? step : null;

  const getFieldStatusIcon = (field: CompositionStep) => {
      if (currentField === field) {
          return isListening ? <Mic className="h-5 w-5 text-destructive animate-pulse" /> : <Loader2 className="h-5 w-5 animate-spin" />;
      }
      if (getValues(field as "to" | "subject" | "body")) {
          return <Ear className="h-5 w-5 text-green-500" />;
      }
      return <Ear className="h-5 w-5 text-muted-foreground" />;
  }

  return (
    <div className="p-4 md:p-6">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            Compose Email
            {isInteracting && (
                <div className="flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-muted text-muted-foreground">
                    {isListening && <><Mic className="h-4 w-4 animate-pulse" />Listening...</>}
                    {isTranscribing && <><Loader2 className="h-4 w-4 animate-spin" />Processing...</>}
                    {isPlaying && <><Ear className="h-4 w-4" />Speaking...</>}
                </div>
            )}
          </CardTitle>
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
                        <Textarea placeholder="Compose your email..." className={cn("min-h-[200px] resize-y", currentField === 'body' && 'border-primary ring-2 ring-primary')} {...field} />
                      </FormControl>
                       {getFieldStatusIcon('body')}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSending || isInteracting} size="lg" className="w-full sm:w-auto">
                {isSending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" />Send Email</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
