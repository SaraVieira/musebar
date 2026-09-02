import { IconBrandGithub } from "@tabler/icons-react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
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
	FieldSeparator,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { authClient } from "#/lib/auth-client";
import { EMAIL_RE } from "#/lib/constants";
import { anyUserExists, getAuthProviders } from "#/lib/user-server";

export const Route = createFileRoute("/login")({
	loader: async () => {
		const [hasUser, providers] = await Promise.all([
			anyUserExists(),
			getAuthProviders(),
		]);
		return { hasUser, providers };
	},
	component: Login,
});

interface LoginValues {
	email: string;
	password: string;
}

function Login() {
	const { hasUser, providers } = Route.useLoaderData();
	const router = useRouter();
	const {
		control,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<LoginValues>({
		defaultValues: { email: "", password: "" },
		mode: "onSubmit",
		reValidateMode: "onChange",
		shouldFocusError: true,
	});

	const submit = handleSubmit(async ({ email, password }) => {
		try {
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
				message: err instanceof Error ? err.message : "GitHub sign-in failed.",
			});
		}
	}

	return (
		<div className="bg-background flex min-h-screen items-center justify-center p-6">
			<div className="w-full max-w-sm">
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="text-xl">Welcome back</CardTitle>
						<CardDescription>Sign in to continue to your board</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={submit} noValidate>
							<FieldGroup>
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
												autoComplete="current-password"
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
										{isSubmitting ? "Signing in…" : "Sign in"}
									</Button>
									{errors.root?.message ? (
										<FieldDescription className="text-destructive text-center">
											{errors.root.message}
										</FieldDescription>
									) : null}
								</Field>

								{providers.github ? (
									<>
										<FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
											Or
										</FieldSeparator>
										<Field>
											<Button
												type="button"
												variant="outline"
												onClick={signInWithGitHub}
											>
												<IconBrandGithub aria-hidden />
												Continue with GitHub
											</Button>
										</Field>
									</>
								) : null}
							</FieldGroup>
						</form>
					</CardContent>
				</Card>
				{hasUser ? null : (
					<FieldDescription className="mt-4 text-center">
						New here?{" "}
						<a href="/register" className="underline underline-offset-4">
							Create an account
						</a>
					</FieldDescription>
				)}
			</div>
		</div>
	);
}
