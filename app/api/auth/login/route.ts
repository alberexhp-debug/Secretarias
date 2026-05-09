import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, generateToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Correo y contraseña son requeridos" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { secretary: true },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
    }

    const token = generateToken(user.id);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, onboardingDone: user.onboardingDone },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
