
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Send, Loader2, Mic, FileText, Square } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { playTone } from "@/lib/audio";

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
  const [isProcessing, setIsProcessing] = React.useState(false); 

  const { toast } = useToast();
  const { play, stop: stopSpeech, isPlaying } = useTextToSpeech();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { to: "", subject: "", body: "" },
  });
  const { setValue, handleSubmit, reset, getValues, trigger } = form;

  const handleTranscription = React.useCallback((field: "to" | "subject" | "body", text: string) => {
    const sanitizedText = text.replace(/(\r\n|\n|\r)/gm, "").trim();
    if (field === 'body') {
      setValue(field, getValues("body") + sanitizedText + " ", { shouldValidate: true });
    } else {
      setValue(field, sanitizedText, { shouldValidate: true });
    }
  }, [setValue, getValues]);

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

  const handleProofread = React.useCallback(async () => {
    stopSpeech();
    const isValid = await trigger();
    if (!isValid) {
      play("There are some errors in the form. Please check the fields.");
      return;
    }
    const { to, subject, body } = getValues();
    const proofreadText = `This email is to: ${to}. The subject is: ${subject}. The body is: ${body || 'The body is empty.'} Would you like to send it?`;
    play(proofreadText);
  }, [getValues, play, stopSpeech, trigger]);

  const stopListening = React.useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      playTone("stop");
      setIsListening(false);
    }
  }, []);
  
  const startListening = React.useCallback(async () => {
    if (isListening || isProcessing || isPlaying) return;

    let currentStep = step;
    if (!currentStep) {
        currentStep = 'recipient';
        setStep('recipient');
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      playTone("start");
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
    
        if (audioBlob.size < 200) { 
          setIsProcessing(false);
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
                 play("Hold the microphone button to dictate for the current field. You can say 'proofread email' or 'send email'.");
                 break;
              case 'unknown':
                const { transcription } = await voiceToTextConversion({ audioDataUri: base64Audio });
                handleTranscription(step, transcription);
                if (step === 'recipient') setStep('subject');
                else if (step === 'subject') setStep('body');
                else if (step === 'body') setStep('done');
                break;
              default:
                 play(`Sorry, the command ${commandResult.command.replace(/_/g, ' ')} is not available here. Please dictate the content for the current field.`);
            }
          } catch (error) {
            console.error("Processing failed:", error);
            toast({ variant: "destructive", title: "Processing Failed", description: "I had trouble understanding. Let's try that again." });
          } finally {
            setIsProcessing(false);
          }
        };
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Mic error:", err);
      toast({ variant: "destructive", title: "Microphone Access Denied" });
      setStep(null);
    }
  }, [isListening, isProcessing, isPlaying, step, play, toast, handleSubmit, onSubmit, handleProofread, handleTranscription]);

  React.useEffect(() => {
    const to = searchParams.get("to");
    const subject = searchParams.get("subject");
    const body = searchParams.get("body");

    let isPreFilled = false;
    if (to) { setValue("to", to); isPreFilled = true; }
    if (subject) { setValue("subject", subject); isPreFilled = true; }
    if (body) { setValue("body", body); isPreFilled = true; }

    if (isPreFilled) {
      trigger(); 
      play("Email draft ready. You can make changes, say 'proofread email' or say 'send email'.");
      setStep('done');
    }

     const autorun = searchParams.get('autorun');
      if (autorun === 'read_list' && !isPreFilled) {
          play("Navigated to Compose. You can type or hold the microphone button to dictate each field.");
          router.replace('/compose', {scroll: false});
      }

    return () => {
      stopSpeech();
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setValue, trigger, play, stopSpeech]);
  
  const isInteracting = isListening || isProcessing || isPlaying;
  const currentField: CompositionStep = isListening || isProcessing ? step : null;

  const getFieldHelperText = (field: CompositionStep) => {
    if (currentField === field) {
        return isListening ? "Listening..." : "Processing...";
    }
    const value = getValues(field as "to" | "subject" | "body");
    const fieldPrompts = {
        recipient: "Hold mic to dictate recipient.",
        subject: "Hold mic to dictate subject.",
        body: "Hold mic to dictate body.",
        done: "Composition complete.",
        null: ""
    }
    return !value ? fieldPrompts[field!] : "";
  }
  
  const micButtonTitle = isListening
    ? "Listening... Release to stop"
    : isProcessing 
    ? "Processing..."
    : isPlaying
    ? "Speaking..."
    : "Hold to dictate";

  return (
    <>
      <div className="p-4 md:p-6 pb-28">
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
            <CardDescription>
              Type your email or hold the microphone button below to dictate each field.
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
                        <FormControl>
                          <Input placeholder="recipient@example.com" {...field} className={cn(currentField === 'recipient' && 'border-primary ring-2 ring-primary')} onFocus={() => setStep('recipient')} />
                        </FormControl>
                        <p className="text-sm text-muted-foreground h-4">{getValues("to") ? "" : getFieldHelperText("recipient")}</p>
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
                        <FormControl>
                          <Input placeholder="Email subject" {...field} className={cn(currentField === 'subject' && 'border-primary ring-2 ring-primary')} onFocus={() => setStep('subject')} />
                        </FormControl>
                         <p className="text-sm text-muted-foreground h-4">{getValues("subject") ? "" : getFieldHelperText("subject")}</p>
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
                        <FormControl>
                          <Textarea placeholder="Dictate your email, or use the microphone button below..." className={cn("min-h-[200px] resize-y", currentField === 'body' && 'border-primary ring-2 ring-primary')} {...field} onFocus={() => setStep('body')} />
                        </FormControl>
                         <p className="text-sm text-muted-foreground h-4">{getValues("body") ? "" : getFieldHelperText("body")}</p>
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
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <div className="fixed bottom-6 right-6 z-50">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button" 
                disabled={isProcessing || isPlaying}
                size="icon"
                className={cn(
                    "rounded-full w-16 h-16 shadow-lg flex items-center justify-center transition-all duration-300",
                    isListening ? 'bg-destructive hover:bg-destructive/90 animate-pulse' : 'bg-primary hover:bg-primary/90',
                    (isProcessing || isPlaying) && "cursor-not-allowed bg-muted"
                )}
                aria-label={micButtonTitle}
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onMouseLeave={stopListening}
                onTouchStart={(e) => { e.preventDefault(); startListening();}}
                onTouchEnd={stopListening}
              >
                {isProcessing ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : isListening ? (
                  <Square className="h-7 w-7 fill-white" />
                ) : (
                  <Mic className="h-7 w-7" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{micButtonTitle}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
}
