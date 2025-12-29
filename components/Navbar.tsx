import Link from "next/link";
import React from "react";

export default function Navbar() {
	return (
		<nav>
			<div className="flex items-center justify-between max-w-full mx-auto p-4">
				<div className="flex items-center space-x-3 p-4">
					<h1 className="border rounded-md bg-[#51A8B1] text-white p-3 text-base font-bold">
						LOGO
					</h1>
					<h3 className="text-xl font-semibold">CE-EMS</h3>
				</div>
				<div className="md:flex items-center justify-between space-x-10 hidden ">
					<ul className="flex items-center justify-between space-x-5 text-gray-500 font-medium">
						<li>
							<Link href="/">Home</Link>
						</li>
						<li>
							<Link href="#">About</Link>
						</li>
						<li>
							<Link href="#">Contact</Link>
						</li>
					</ul>

					<div className="flex items-center justify-between">
						<button className="bg-[#51A8B1] hover:bg-teal-600 text-white px-4 py-2 rounded-md">
							<Link href={"/login"}>Login</Link>
						</button>
					</div>
				</div>
			</div>
		</nav>
	);
}
