import { createFileRoute, useRouter } from "@tanstack/react-router";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Card } from "#/components/pouf/surface";
import { Stack, Row } from "#/components/pouf/layout";
import { Heading, Text } from "#/components/pouf/text";
import { Field, Input } from "#/components/pouf/Input";
import { Button } from "#/components/pouf/Button";
import { Separator } from "#/components/pouf/separator";
import { Blob } from "#/components/pouf/media";
import { authClient } from "#/lib/auth-client";
import { EMAIL_RE } from "#/lib/constants";
import { anyUserExists } from "#/lib/user-server";

export const Route = createFileRoute("/login")({
  loader: async () => ({ hasUser: await anyUserExists() }),
  component: Login,
});

interface LoginValues {
  email: string;
  password: string;
}

const DEFAULT_VALUES: LoginValues = { email: "", password: "" };

export function Login() {
  const { hasUser } = Route.useLoaderData();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    defaultValues: DEFAULT_VALUES,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  const submit = handleSubmit(async (values) => {
    try {
      const { email, password } = values;
      const { error } = await authClient.signIn.email({ email, password });
      if (error) throw new Error(error.message ?? "Invalid email or password.");
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

  async function signInWithGitHub() {
    try {
      const { error } = await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard",
      });
      if (error) throw new Error(error.message ?? "GitHub sign-in failed.");
    } catch (err) {
      setError("root", {
        message:
          err instanceof Error
            ? err.message
            : "GitHub sign-in failed. Try again.",
      });
    }
  }

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "70vh",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <form onSubmit={submit} noValidate>
          <Card>
            <Stack gap={5}>
              <Stack gap={3}>
                <Blob icon="lock" tone="purple" />
                <Stack gap={1}>
                  <Heading level={2}>Welcome back</Heading>
                  <Text size="sm" muted>
                    Sign in to your account.
                  </Text>
                </Stack>
              </Stack>

              <Stack gap={4}>
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
                              placeholder="••••••••…"
                              autoComplete="current-password"
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
                  Sign in
                </Button>
                {errors.root?.message ? (
                  <div
                    role="alert"
                    className="text-sm text-[color:var(--color-pink)]"
                  >
                    {errors.root.message}
                  </div>
                ) : null}
              </Stack>

              <Separator />
              <Button block variant="quiet" onClick={signInWithGitHub}>
                Continue with GitHub
              </Button>
              {hasUser ? null : (
                <Row justify="center">
                  <Text size="sm" muted>
                    New here?{" "}
                    <a href="/register" className="underline">
                      Create an account
                    </a>
                  </Text>
                </Row>
              )}
            </Stack>
          </Card>
        </form>
      </div>
    </div>
  );
}
