import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// التأكد من وجود جدول إعدادات كلمة المرور
async function initAdminTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id INT PRIMARY KEY DEFAULT 1,
      password TEXT NOT NULL
    );
  `);

  const res = await pool.query('SELECT * FROM admin_settings WHERE id = 1');
  if (res.rows.length === 0) {
    // كلمة المرور الافتراضية لأول مرة
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await pool.query('INSERT INTO admin_settings (id, password) VALUES (1, $1)', [defaultPassword]);
  }
}

// تسجيل الدخول
export async function POST(request: Request) {
  try {
    await initAdminTable();
    const { password } = await request.json();

    const res = await pool.query('SELECT password FROM admin_settings WHERE id = 1');
    const currentStoredPassword = res.rows[0]?.password;

    if (password === currentStoredPassword) {
      return NextResponse.json({ success: true, message: 'Authenticated successfully' });
    } else {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// تغيير كلمة المرور من قبل صاحب المتجر
export async function PUT(request: Request) {
  try {
    await initAdminTable();
    const { currentPassword, newPassword } = await request.json();

    const res = await pool.query('SELECT password FROM admin_settings WHERE id = 1');
    const currentStoredPassword = res.rows[0]?.password;

    if (currentPassword !== currentStoredPassword) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: 'كلمة المرور الجديدة قصيرة جداً' }, { status: 400 });
    }

    // تحديث كلمة المرور في قاعدة البيانات مباشرة
    await pool.query('UPDATE admin_settings SET password = $1 WHERE id = 1', [newPassword]);

    return NextResponse.json({ success: true, message: 'تم تحديث كلمة المرور بنجاح 🎉' });
  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'فشل تغيير كلمة المرور' }, { status: 500 });
  }
}
