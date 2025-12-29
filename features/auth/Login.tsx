import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

import React from "react";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
	return (
		<div className="w-full max-w-3xl mx-auto my-20">
			<div className="rounded-md shadow-md p-6">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-[#51A8B1]">Logo</h1>
					<h3 className="text-xl font-semibold py-1">Welcome back!</h3>
				</div>
				<form action="#">
					<div className="flex flex-col space-y-2">
						<label> Email Address</label>
						<Input
							type="email"
							className="input-field"
							placeholder="Enter your Email"
						/>
					</div>
					<div className="flex flex-col space-y-2 ">
						<label>Password</label>
						<Input
							type="password"
							placeholder="Enter your password"
							className="input-field"
						/>
					</div>
					<div>
						<p className="text-base font-medium">
							<Link href="/forgetPassword">Forgot password?</Link>
						</p>
					</div>
					<Button className="login-button">
						<Link href="/onboarding">Login</Link>
					</Button>
				</form>
				<div className="text-center my-5">
					<p>OR</p>
				</div>

				<Button className="w-full bg-gray-200 text-black text-base font-semibold border hover:bg-white py-3">
					<FcGoogle size={50} />
					Continue with Google
				</Button>

				<div className="text-center pt-3">
					<p>
						Are you new?
						<Link href="/register" className="text-teal-500">
							Create an account
						</Link>
					</p>
				</div>
				<div className=" text-teal-500 flex items-center justify-center space-x-3 mt-6 ">
					<p className="border-r pr-3">Terms of use</p>
					<p>privacy policy</p>
				</div>
			</div>
		</div>
	);
}
