import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { cn } from "#/lib/utils";

const schema = z.object({
	email: z.string().email("Invalid email"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const {
		register,
		handleSubmit,
		// formState: { errors, isSubmitting },
	} = useForm<FormData>({
		resolver: zodResolver(schema),
	});

	const onSubmit = async (data: FormData) => {
		const data_error = await authClient.signIn.email(
			{
				/**
				 * The user email
				 */
				email: data.email,
				/**
				 * The user password
				 */
				password: data.password,
				/**
				 * A URL to redirect to after the user verifies their email (optional)
				 */
				callbackURL: "/dashboard",
				/**
				 * remember the user session after the browser is closed.
				 * @default true
				 */
				rememberMe: false,
			},
			{
				onRequest: () => {
					// show loading
				},
				onSuccess: () => {
					alert("log in successful ");
				},
				onError: (ctx) => {
					alert(ctx.error.message);
				},
			},
		);
	};

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle>Login to your account</CardTitle>
					<CardDescription>
						Enter your email below to login to your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input
									id="email"
									type="email"
									placeholder="mdasd@example.com"
									required
									{...register("email")}
								/>
							</Field>
							<Field>
								<div className="flex items-center">
									<FieldLabel htmlFor="password">Password</FieldLabel>
									<a
										href="/signup"
										className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
									>
										Forgot your password?
									</a>
								</div>
								<Input
									id="password"
									type="password"
									required
									{...register("password")}
								/>
							</Field>
							<Field>
								<Button type="submit">Login</Button>
								<Button variant="outline" type="button">
									Login with Google
								</Button>
								<FieldDescription className="text-center">
									Don't have an account? <a href="/signup">Sign up</a>
								</FieldDescription>
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
