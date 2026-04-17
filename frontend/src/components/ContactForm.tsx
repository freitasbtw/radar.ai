"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  email: z.string().email("Endereço de e-mail inválido."),
  message: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres.")
});

export function ContactForm() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  const isContactConfigured = Boolean(contactEmail);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: ""
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!contactEmail) {
      return;
    }

    const subject = encodeURIComponent(`Contato RadarSP - ${values.name}`);
    const body = encodeURIComponent(
      [
        `Nome: ${values.name}`,
        `E-mail: ${values.email}`,
        "",
        "Mensagem:",
        values.message,
      ].join("\n")
    );

    window.location.assign(`mailto:${contactEmail}?subject=${subject}&body=${body}`);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail Corporativo</FormLabel>
              <FormControl>
                <Input type="email" placeholder="voce@empresa.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensagem / Pergunta</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Como podemos te ajudar com a plataforma?" 
                  className="resize-none h-24"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-2">
          <Button type="submit" className="w-full" disabled={!isContactConfigured}>
            {isContactConfigured ? "Continuar por E-mail" : "Contato indisponível"}
          </Button>
        </div>
        <p className="text-xs leading-5 text-slate-500">
          {isContactConfigured
            ? `Ao enviar, abriremos seu cliente de e-mail para ${contactEmail}.`
            : "Defina NEXT_PUBLIC_CONTACT_EMAIL para habilitar o contato a partir desta tela."}
        </p>
      </form>
    </Form>
  );
}
