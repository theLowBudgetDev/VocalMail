
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
import { sendEmail } from "@/lib/actions";
import { useCurrentUser } from "@/hooks/use-current-user";

const emailSchema = z.object({
  to: z.string().email({ message: "Invalid email address." }),
  subject: z.string().min(1, { message: "Subject is required." }),
  body: z.string().min(1, { message: "Body is required." }),
});

type CompositionStep = "to" | "subject" | "body" | "review" | "correcting";

export default function ComposePage() {
  const [isSending, setIsSending] = React.useState(false);
  const [step, setStep] = React.useState<CompositionStep>("to");
  const [isListening, setIsListening] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const { toast } = useToast();
  const { play, stop: stopSpeech, isPlaying } = useTextToSpeech();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser } = useCurrentUser();

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { to: "", subject: "", body: "" },
  });
  const { setValue, handleSubmit, getValues, trigger, formState: { errors } } = form;

  const handleProofread = React.useCallback(async () => {
    stopSpeech();
    const isValid = await trigger();
    if (!isValid) {
      const errorMessages = Object.values(errors).map(e => e.message).join(' ');
      play(`There are some errors. ${errorMessages}. You can say 'make a correction' to fix them.`);
      setStep('correcting');
      return;
    }
    const { to, subject, body } = getValues();
    const proofreadText = `This email is to: ${to}. The subject is: ${subject}. The body is: ${body}. You can now say 'send email' or 'make a correction'.`;
    play(proofreadText);
  }, [getValues, play, stopSpeech, trigger, errors]);

  const handleTranscription = React.useCallback(async (transcription: string) => {
    if (!['to', 'subject', 'body'].includes(step)) return;

    const currentField = step as 'to' | 'subject' | 'body';

    setIsProcessing(true);
    try {
        const result = await voiceToTextConversion({
            transcription: transcription,
            context: currentField,
        });

        if (result.transcription) {
             const currentValue = getValues(currentField);
             const newValue = currentField === 'body' ? (currentValue ? currentValue + result.transcription + " " : result.transcription + " ") : result.transcription;
             setValue(currentField, newValue, { shouldValidate: true });

            const isValid = await trigger(currentField);
            const updatedValue = getValues(currentField);

            if (!isValid || !updatedValue) {
                const errorMessage = errors[currentField]?.message || `The ${currentField} field is empty. Please try again.`;
                play(errorMessage);
            } else {
                play(`${currentField.charAt(0).toUpperCase() + currentField.slice(1)} is set to: ${updatedValue}.`, () => {
                    if (currentField === 'to') {
                        setStep('subject');
                    } else if (currentField === 'subject') {
                        setStep('body');
                    } else if (currentField === 'body') {
                        setStep('review');
                    }
                });
            }
        } else {
             play(`I didn't catch that. The ${currentField} field is still empty.`);
        }
    } catch (error) {
       console.error("Transcription failed:", error);
       toast({ variant: "destructive", title: "Transcription Failed", description: "I had trouble converting that to text. Let's try that again." });
    } finally {
        setIsProcessing(false);
    }
  }, [step, setValue, getValues, toast, trigger, errors, play]);

  const onSubmit = React.useCallback(async (data: z.infer<typeof emailSchema>) => {
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Not logged in.' });
        return;
    }
    setIsSending(true);
    play("Sending email...");
    
    try {
        await sendEmail(currentUser.id, data.to, data.subject, data.body);
        toast({ title: "Email Sent!", description: `Email to ${data.to} sent successfully.` });
        play("Email sent successfully. Redirecting to your sent folder.", () => {
            router.push('/sent?autorun=read_list');
        });
    } catch(error: any) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Failed to send email', description: error.message });
        setIsSending(false);
    }
  }, [router, toast, play, currentUser]);
  
  const stopListening = React.useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      playTone("stop");
      setIsListening(false);
    }
  }, []);

  const handleRecognitionResult = React.useCallback((result: RecognizeCommandOutput) => {
    const { command, transcription, correctionField } = result;
    
    const isDictation = command === 'unknown' && transcription;
    const isReviewPhase = step === 'review' || step === 'correcting';

    if (isDictation && !isReviewPhase) {
        handleTranscription(transcription!);
        return;
    }

    switch(command) {
        case 'action_focus_to':
            setStep('to');
            break;
        case 'action_focus_subject':
            setStep('subject');
            break;
        case 'action_focus_body':
            setStep('body');
            break;
        case 'action_send':
            if (isReviewPhase) {
                handleSubmit(onSubmit)();
            }
            break;
        case 'action_proofread_email':
             setStep('review');
            break;
        case 'action_correct_email':
             setStep(correctionField || 'correcting');
            break;
        case 'action_help':
            play("You are composing an email. Say 'recipient', 'subject', or 'body' to switch fields. Hold the mic to dictate. Say 'proofread' when you are finished.");
            break;
        default:
             if (!isDictation) {
                play(`Sorry, the command ${command.replace(/_/g, ' ')} is not available here.`);
             }
    }
  }, [step, handleSubmit, onSubmit, play, handleTranscription]);


  const processAudio = React.useCallback(async (audioDataUri: string) => {
    setIsProcessing(true);
    try {
        const result = await recognizeCommand({ audioDataUri, currentPath: '/compose' });
        handleRecognitionResult(result);
    } catch (error) {
         console.error("Processing failed:", error);
         toast({ variant: "destructive", title: "Processing Failed", description: "I had trouble understanding. Let's try that again." });
    } finally {
        setIsProcessing(false);
    }
  }, [handleRecognitionResult, toast]);

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
    return () => {
      stopSpeech();
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [stopSpeech]);

  React.useEffect(() => {
    if(isSending || isPlaying || isProcessing) return;
    
    const playStepPrompt = () => {
        switch(step) {
            case 'to':
                play("Who is the recipient? Hold the mic to dictate, or say 'subject' or 'body' to switch.");
                break;
            case 'subject':
                play("What is the subject?");
                break;
            case 'body':
                play("Please dictate the body of the email.");
                break;
            case 'review':
                handleProofread();
                break;
            case 'correcting':
                play("Which field would you like to correct? Recipient, subject, or body?");
                break;
        }
    }

    const timer = setTimeout(playStepPrompt, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isSending, isProcessing]);

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
          router.replace('/compose', {scroll: false});
      }
       setStep('to');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setValue, trigger]);

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
    if (step === field && !isInteracting) {
        return `Hold Spacebar or the mic button to dictate.`;
    }
    return "";
  }
  
  const micButtonTitle = isListening
    ? "Listening... Release to stop"
    : isProcessing 
    ? "Processing..."
    : isPlaying
    ? "Speaking..."
    : "Hold to dictate / speak command";

  return (
    <>
      <div className="p-4 md:p-6 pb-28">
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
            <CardDescription>
              The app will guide you. Say 'recipient', 'subject', or 'body' anytime to switch fields.
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
                  <Button type="submit" disabled={isSending || isInteracting || step !== 'review'} size="lg" className="w-full sm:w-auto">
                    {isSending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                    ) : (
                      <><Send className="mr-2 h-4 w-4" />Send Email</>
                    )}
                  </Button>
                   <Button type="button" variant="outline" onClick={() => setStep('review')} disabled={isInteracting} size="lg" className="w-full sm:w-auto">
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
