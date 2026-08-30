import {
  createFileRoute,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { authClient } from "#/lib/auth-client";
import { EMAIL_RE } from "#/lib/constants";
import { anyUserExists } from "#/lib/user-server";

export const Route = createFileRoute("/register")({
  beforeLoad: async () => {
    if (await anyUserExists()) throw redirect({ href: "/login" });
  },
  component: Register,
});

interface RegisterValues {
  name: string;
  email: string;
  password: string;
}

function Register() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    defaultValues: { name: "", email: "", password: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  const submit = handleSubmit(async ({ name, email, password }) => {
    try {
      const { error } = await authClient.signUp.email({ name, email, password });
      if (error)
        throw new Error(error.message ?? "Could not create your account.");
      await router.invalidate();
      router.navigate({ href: "/dashboard" });
    } catch (err) {
      setError("root", {
        message:
          err instanceof Error ? err.message : "Something went wrong. Try again.",
      });
    }
  });

  return (
    <div className="bg-muted flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>A minute and you're in.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} noValidate>
              <FieldGroup>
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Controller
                    name="name"
                    control={control}
                    rules={{
                      required: "Name is required.",
                      minLength: {
                        value: 2,
                        message: "Use at least 2 characters.",
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="name"
                        type="text"
                        placeholder="Ada Lovelace"
                        autoComplete="name"
                        aria-invalid={!!errors.name}
                        required
                      />
                    )}
                  />
                  {errors.name ? (
                    <FieldDescription className="text-destructive">
                      {errors.name.message}
                    </FieldDescription>
                  ) : null}
                </Field>

                <Field data-invalid={!!errors.email}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Controller
                    name="email"
                    control={control}
                    rules={{
                      required: "Email is required.",
                      pattern: {
                        value: EMAIL_RE,
                        message: "Enter a valid email address.",
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        aria-invalid={!!errors.email}
                        required
                      />
                    )}
                  />
                  {errors.email ? (
                    <FieldDescription className="text-destructive">
                      {errors.email.message}
                    </FieldDescription>
                  ) : null}
                </Field>

                <Field data-invalid={!!errors.password}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Controller
                    name="password"
                    control={control}
                    rules={{
                      required: "Password is required.",
                      minLength: {
                        value: 8,
                        message: "Use at least 8 characters.",
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="password"
                        type="password"
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        aria-invalid={!!errors.password}
                        required
                      />
                    )}
                  />
                  {errors.password ? (
                    <FieldDescription className="text-destructive">
                      {errors.password.message}
                    </FieldDescription>
                  ) : null}
                </Field>

                <Field>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating…" : "Create account"}
                  </Button>
                  {errors.root?.message ? (
                    <FieldDescription className="text-destructive text-center">
                      {errors.root.message}
                    </FieldDescription>
                  ) : null}
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <FieldDescription className="mt-4 text-center">
          Already have an account?{" "}
          <a href="/login" className="underline underline-offset-4">
            Sign in
          </a>
        </FieldDescription>
      </div>
    </div>
  );
}
