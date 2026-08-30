import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { authClient } from "#/lib/auth-client";
import { anyUserExists } from "#/lib/user-server";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Card } from "#/components/pouf/surface";
import { Stack, Row } from "#/components/pouf/layout";
import { Heading, Text } from "#/components/pouf/text";
import { Field, Input } from "#/components/pouf/Input";
import { Button } from "#/components/pouf/Button";
import { Blob } from "#/components/pouf/media";
import { EMAIL_RE } from "#/lib/constants";

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

const DEFAULT_VALUES: RegisterValues = { name: "", email: "", password: "" };

function Register() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    defaultValues: DEFAULT_VALUES,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  const submit = handleSubmit(async (values) => {
    try {
      const { name, email, password } = values;
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
      });
      if (error)
        throw new Error(error.message ?? "Could not create your account.");
      await router.invalidate();
      router.navigate({ href: "/dashboard" });
    } catch (err) {
      setError("root", {
        message:
          err instanceof Error
            ? err.message
            : "Something went wrong. Try again.",
      });
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center w-screen">
      <div className="grid place-items-center min-h-[7vh] p-6">
        <div style={{ width: "100%", maxWidth: 420 }}>
          <form onSubmit={submit} noValidate>
            <Card>
              <Stack gap={5}>
                <Stack gap={3}>
                  <Blob icon="user" tone="mint" />
                  <Stack gap={1}>
                    <Heading level={2}>Create your account</Heading>
                    <Text size="sm" muted>
                      A minute and you're in.
                    </Text>
                  </Stack>
                </Stack>

                <Stack gap={4}>
                  <Field label="Name" error={errors.name?.message}>
                    {(id, describedBy) => (
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
                            ref={field.ref}
                            id={id}
                            name={field.name}
                            describedBy={describedBy}
                            type="text"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            placeholder="Ada Lovelace"
                            autoComplete="name"
                            required
                            invalid={!!errors.name}
                          />
                        )}
                      />
                    )}
                  </Field>
                  <Field label="Email" error={errors.email?.message}>
                    {(id, describedBy) => (
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
                            ref={field.ref}
                            id={id}
                            name={field.name}
                            describedBy={describedBy}
                            type="email"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            placeholder="you@example.com…"
                            autoComplete="email"
                            inputMode="email"
                            autoCapitalize="none"
                            spellCheck={false}
                            required
                            invalid={!!errors.email}
                          />
                        )}
                      />
                    )}
                  </Field>
                  <Field label="Password" error={errors.password?.message}>
                    {(id, describedBy) => (
                      <Row gap={2} wrap={false}>
                        <div style={{ flex: 1, minWidth: 0 }}>
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
                                ref={field.ref}
                                id={id}
                                name={field.name}
                                describedBy={describedBy}
                                type={showPassword ? "text" : "password"}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                placeholder="At least 8 characters"
                                autoComplete="new-password"
                                required
                                invalid={!!errors.password}
                              />
                            )}
                          />
                        </div>
                        <Button
                          variant="quiet"
                          onClick={() => setShowPassword((s) => !s)}
                        >
                          {showPassword ? "Hide" : "Show"}
                        </Button>
                      </Row>
                    )}
                  </Field>
                  <Button block type="submit" loading={isSubmitting}>
                    Create account
                  </Button>
                  {errors.root?.message ? (
                    <div role="alert" className="text-sm text-pink">
                      {errors.root.message}
                    </div>
                  ) : null}
                </Stack>

                <Row justify="center">
                  <Text size="sm" muted>
                    Already have an account?{" "}
                    <a href="/login" className="underline">
                      Sign in
                    </a>
                  </Text>
                </Row>
              </Stack>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
