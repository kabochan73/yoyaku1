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
  name:                  z.string().min(1, { message: '名前を入力してください' }),
  email:                 z.string().email({ message: '正しいメールアドレスを入力してください' }),
  phone:                 z.string().optional(),
  password:              z.string().min(8, { message: 'パスワードは8文字以上で入力してください' }),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'パスワードが一致しません',
  path: ['password_confirmation'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
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
      const res = await api.post('/auth/register', data)
      setAuth(res.data.user, res.data.token)
      router.push('/')
    } catch (err: unknown) {
      // Laravelから返ってくるバリデーションエラーをフォームに反映する
      const laravelErrors =
        (err as { response?: { data?: { errors?: Record<string, string[]> } } })
          ?.response?.data?.errors

      if (laravelErrors) {
        Object.entries(laravelErrors).forEach(([field, messages]) => {
          setError(field as keyof FormData, { message: messages[0] })
        })
      } else {
        setError('email', { message: '登録に失敗しました' })
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">新規登録</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">名前</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

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
            <label className="block text-sm font-medium mb-1">
              電話番号
              <span className="text-gray-400 font-normal ml-1">（任意）</span>
            </label>
            <input
              type="tel"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              {...register('phone')}
            />
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

          <div>
            <label className="block text-sm font-medium mb-1">パスワード（確認）</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              {...register('password_confirmation')}
            />
            {errors.password_confirmation && (
              <p className="text-red-500 text-sm mt-1">{errors.password_confirmation.message}</p>
            )}
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            登録する
          </Button>
        </form>

        <p className="text-center text-sm mt-4 text-gray-600">
          すでにアカウントをお持ちの方は
          <Link href="/auth/login" className="text-green-600 hover:underline ml-1">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  )
}
