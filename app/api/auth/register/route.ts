import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese correo" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, trialEnd },
    });

    const token = generateToken(user.id);

    const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
