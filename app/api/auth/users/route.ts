import { NextRequest, NextResponse } from "next/server";
import {
  getAllUsers,
  saveUser,
  updateUser,
  findUserByCredentials,
  StoredUser,
} from "@/lib/auth/userStorage";
import { DEFAULT_USER_PERMISSIONS, DEFAULT_USER_SETTINGS } from "@/lib/auth/userStorage";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const users = await getAllUsers();
  if (id) {
    const user = users.find((u) => u.id === id);
    if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    return NextResponse.json({ user });
  }

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, phone, password, name, email, identityInfo } = body;

    // Action: "login"
    if (action === "login") {
      const user = await findUserByCredentials(phone, password);
      if (!user) {
        return NextResponse.json(
          { error: "Kullanıcı adı/telefon veya şifre hatalı!" },
          { status: 401 }
        );
      }
      if (user.isSuspended) {
        return NextResponse.json(
          { error: "Hesabınız yönetici tarafından askıya alınmıştır." },
          { status: 403 }
        );
      }

      // Update last login timestamp
      const updated = await updateUser(user.id, {
        lastLoginAt: new Date().toLocaleString("tr-TR"),
      });

      return NextResponse.json({
        success: true,
        user: updated || user,
      });
    }

    // Action: "register"
    if (action === "register") {
      if (!name || !phone || !password) {
        return NextResponse.json(
          { error: "İsim, telefon ve şifre alanları zorunludur!" },
          { status: 400 }
        );
      }

      const existing = await findUserByCredentials(phone);
      if (existing) {
        return NextResponse.json(
          { error: "Bu telefon numarasıyla kayıtlı bir kullanıcı zaten mevcut!" },
          { status: 400 }
        );
      }

      const newUser = await saveUser({
        name: name.trim(),
        phone: phone.trim(),
        password: password.trim(),
        email: email ? email.trim() : "",
        role: "user",
        permissions: DEFAULT_USER_PERMISSIONS,
        settings: DEFAULT_USER_SETTINGS,
        identityInfo: identityInfo || {
          tcKimlik: "",
          birthDate: "",
          gender: "",
          bloodType: "",
          chronicDiseases: "",
          allergies: "",
          emergencyContactName: "",
          emergencyContactPhone: "",
          city: "",
          address: "",
          isVerified: false,
        },
      });

      return NextResponse.json({
        success: true,
        user: newUser,
      });
    }

    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  } catch (err: any) {
    console.error("[api/auth/users] Error:", err);
    return NextResponse.json({ error: err.message || "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: "Kullanıcı ID ve güncellemeler zorunludur!" }, { status: 400 });
    }

    const updated = await updateUser(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı veya güncellenemedi." }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error("[api/auth/users PUT] Error:", err);
    return NextResponse.json({ error: err.message || "Sunucu hatası" }, { status: 500 });
  }
}
