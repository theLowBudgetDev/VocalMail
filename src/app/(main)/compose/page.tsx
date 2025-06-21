"use client";

import * as React from "react";
import { Send, Loader2 } from "lucide-react";
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
import { VoiceRecorder } from "@/components/voice-recorder";
import { useToast } from "@/hooks/use-toast";

const emailSchema = z.object({
  to: z.string().email({ message: "Invalid email address." }),
  subject: z.string().min(1, { message: "Subject is required." }),
  body: z.string().min(1, { message: "Email body cannot be empty." }),
});

export default function ComposePage() {
  const [isSending, setIsSending] = React.useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      to: "",
      subject: "",
      body: "",
    },
  });

  const { setValue } = form;

  const handleTranscription = (field: "to" | "subject" | "body", text: string) => {
    const sanitizedText = text.replace(/(\r\n|\n|\r)/gm, "").trim();
    if (field === 'body') {
      setValue(field, form.getValues("body") + sanitizedText + " ", { shouldValidate: true });
    } else {
      setValue(field, sanitizedText, { shouldValidate: true });
    }
  };
  
  const onSubmit = React.useCallback(async (data: z.infer<typeof emailSchema>) => {
    setIsSending(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSending(false);
    toast({
      title: "Email Sent!",
      description: `Your email to ${data.to} has been sent successfully.`,
    });
    form.reset();
  }, [form, toast]);

  React.useEffect(() => {
    const handleCommand = (event: CustomEvent) => {
      const { command } = event.detail;
      if (command === 'action_send') {
        form.handleSubmit(onSubmit)();
      }
    };
    window.addEventListener('voice-command', handleCommand as EventListener);
    return () => {
      window.removeEventListener('voice-command', handleCommand as EventListener);
    };
  }, [form, onSubmit]);


  return (
    <div className="p-4 md:p-6">
    <Card className="max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Compose Email</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input placeholder="recipient@example.com" {...field} />
                    </FormControl>
                    <VoiceRecorder onTranscription={(text) => handleTranscription("to", text)} fieldName="recipient's email address" />
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
                      <Input placeholder="Email subject" {...field} />
                    </FormControl>
                    <VoiceRecorder onTranscription={(text) => handleTranscription("subject", text)} fieldName="subject" />
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
                  <div className="relative">
                    <FormControl>
                      <Textarea placeholder="Compose your email by typing or using your voice..." className="min-h-[200px] resize-y pr-16" {...field} />
                    </FormControl>
                     <div className="absolute bottom-3 right-3">
                      <VoiceRecorder onTranscription={(text) => handleTranscription("body", text)} fieldName="email body" large />
                     </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSending} size="lg" className="w-full sm:w-auto">
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
    </div>
  );
}
