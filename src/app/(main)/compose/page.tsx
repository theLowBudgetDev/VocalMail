
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
import { recognizeCommand, type RecognizeCommandOutput } from "@/ai/flows/command-recognition";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { playTone } from "@/lib/audio";

const emailSchema = z.object({
  to: z.string().email({ message: "Invalid email address." }),
  subject: z.string().min(1, { message: "Subject is required." }),
  body: z.string(),
});

type CompositionStep = "to" | "subject" | "body" | "review" | "correcting";
type CompositionFlow = "initial" | "correction";

export default function ComposePage() {
  const [isSending, setIsSending] = React.useState(false);
  const [step, setStep] = React.useState<CompositionStep>("to");
  const [compositionFlow, setCompositionFlow] = React.useState<CompositionFlow>('initial');
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
  const { setValue, handleSubmit, reset, getValues, trigger, formState: { errors } } = form;

  const handleTranscription = React.useCallback((field: "to" | "subject" | "body", text: string) => {
    if (field === 'body') {
      setValue(field, getValues("body") + text + " ", { shouldValidate: true });
    } else {
      setValue(field, text, { shouldValidate: true });
    }
  }, [setValue, getValues]);

  const onSubmit = React.useCallback(async (data: z.infer<typeof emailSchema>) => {
    setIsSending(true);
    play("Sending email...");
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSending(false);
    toast({ title: "Email Sent!", description: `Email to ${data.to} sent successfully.` });
    play("Email sent successfully.", () => {
        reset({ to: "", subject: "", body: "" });
        setStep("to");
        setCompositionFlow("initial");
    });
  }, [reset, toast, play]);

  const handleProofread = React.useCallback(async () => {
    stopSpeech();
    const isValid = await trigger();
    if (!isValid) {
      const errorMessages = Object.values(errors).map(e => e.message).join(' ');
      play(`There are some errors. ${errorMessages}. You can say 'make a correction' to fix them.`);
      setStep("review");
      return;
    }
    const { to, subject, body } = getValues();
    const proofreadText = `This email is to: ${to}. The subject is: ${subject}. The body is: ${body || 'The body is empty.'} You can say 'send email' or 'make a correction'.`;
    play(proofreadText);
  }, [getValues, play, stopSpeech, trigger, errors]);
  
  const stopListening = React.useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      playTone("stop");
      setIsListening(false);
    }
  }, []);

  const handleCommand = React.useCallback((result: RecognizeCommandOutput) => {
    const { command, correctionField } = result;
    switch(command) {
      case 'action_send':
        handleSubmit(onSubmit)();
        break;
      case 'action_proofread_email':
        handleProofread();
        break;
      case 'action_correct_email':
        setCompositionFlow('correction');
        if (correctionField) {
          setStep(correctionField);
        } else {
          setStep('correcting');
        }
        break;
      case 'action_help':
        play("You are in the compose flow. Hold the microphone button to dictate for the highlighted field. After filling the body, the email will be proofread. You can then say 'send email' or 'make a correction'.");
        break;
      case 'unknown':
        // This case is handled in processAudio for dictation
        break;
      default:
         play(`Sorry, the command ${command.replace(/_/g, ' ')} is not available here.`);
    }
  }, [handleSubmit, onSubmit, handleProofread, play]);

  const processAudio = React.useCallback(async (audioDataUri: string) => {
    setIsProcessing(true);
    try {
      if (step === 'review' || step === 'correcting') {
        // We expect a command
        const result = await recognizeCommand({ audioDataUri, currentPath: '/compose' });
        handleCommand(result);
      } else { 
        // We are dictating a field
        const result = await voiceToTextConversion({
          audioDataUri,
          context: step,
        });

        if (result.transcription) {
          handleTranscription(step, result.transcription);
        }
        
        // Transition to the next step
        if (compositionFlow === 'correction') {
            setStep('review');
            setCompositionFlow('initial');
        } else if (step === 'to') {
            setStep('subject');
        } else if (step === 'subject') {
            setStep('body');
        } else if (step === 'body') {
            setStep('review');
        }
      }
    } catch (error) {
         console.error("Processing failed:", error);
         toast({ variant: "destructive", title: "Processing Failed", description: "I had trouble understanding. Let's try that again." });
    } finally {
        setIsProcessing(false);
    }
  }, [step, handleTranscription, toast, handleCommand, play, compositionFlow]);

  const startListening = React.useCallback(async () => {
    if (isListening || isProcessing || isPlaying) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      playTone("start");
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      
      mediaRecorderRef.current.onstop = async () => {
        setIsListening(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];
        mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
    
        if (audioBlob.size < 200) { 
          return;
        }
    
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => processAudio(reader.result as string);
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Mic error:", err);
      toast({ variant: "destructive", title: "Microphone Access Denied" });
    }
  }, [isListening, isProcessing, isPlaying, toast, processAudio]);
  
  React.useEffect(() => {
    // Stop speech and recording on unmount
    return () => {
      stopSpeech();
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [stopSpeech]);

  // Handle step transitions and audio prompts
  React.useEffect(() => {
    if(isSending || isPlaying || isProcessing) return;
    switch(step) {
        case 'to':
            play("First, who is the recipient?");
            break;
        case 'subject':
            play("Got it. Now, what is the subject?");
            break;
        case 'body':
            play("Great. Please dictate the body of the email.");
            break;
        case 'review':
            handleProofread();
            break;
        case 'correcting':
            play("Which field would you like to correct? Recipient, subject, or body?");
            break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isSending, isProcessing]);

  // Handle pre-filled form from search params
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
      setStep('review');
    } else {
      const autorun = searchParams.get('autorun');
      if (autorun === 'read_list') {
          setStep('to');
          router.replace('/compose', {scroll: false});
      } else {
         setStep('to');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setValue, trigger, play]);

  // Handle spacebar for dictation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        startListening();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        stopListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startListening, stopListening]);


  const isInteracting = isListening || isProcessing || isPlaying;
  
  const getFieldHelperText = (field: CompositionStep) => {
    if (step === field) {
        return isListening ? "Listening..." : isProcessing ? "Processing..." : `Hold mic to dictate ${field === 'to' ? 'recipient' : field}.`;
    }
    return "";
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
              Follow the audio prompts and hold the microphone button to dictate each field.
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
                          <Input placeholder="recipient@example.com" {...field} className={cn(step === 'to' && 'border-primary ring-2 ring-primary')} />
                        </FormControl>
                        <p className="text-sm text-muted-foreground h-4">{getFieldHelperText("to")}</p>
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
                          <Input placeholder="Email subject" {...field} className={cn(step === 'subject' && 'border-primary ring-2 ring-primary')} />
                        </FormControl>
                         <p className="text-sm text-muted-foreground h-4">{getFieldHelperText("subject")}</p>
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
                          <Textarea placeholder="Dictate your email, or use the microphone button below..." className={cn("min-h-[200px] resize-y", step === 'body' && 'border-primary ring-2 ring-primary')} {...field} />
                        </FormControl>
                         <p className="text-sm text-muted-foreground h-4">{getFieldHelperText("body")}</p>
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

    