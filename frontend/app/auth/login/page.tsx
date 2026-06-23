'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'

const schema = z.object({
  email:    z.string().email({ message: '正しいメールアドレスを入力してください' }),
  password: z.string().min(8, { message: 'パスワードが正しくありません' }),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post('/auth/login', data)
      setAuth(res.data.user, res.data.token)
      router.push('/')
    } catch (err: unknown) {
      // Laravelのバリデーションエラーは errors.email に入ってくる
      const message =
        (err as { response?: { data?: { errors?: { email?: string[] } } } })
          ?.response?.data?.errors?.email?.[0] ?? 'ログインに失敗しました'
      setError('email', { message })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">ログイン</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">メールアドレス</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">パスワード</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            ログイン
          </Button>
        </form>

        <p className="text-center text-sm mt-4 text-gray-600">
          アカウントをお持ちでない方は
          <Link href="/auth/register" className="text-green-600 hover:underline ml-1">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  )
}
