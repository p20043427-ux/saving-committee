import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";

export function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("이름을 입력해주세요."); return; }
    if (password.length < 6) { setError("비밀번호는 6자 이상이어야 합니다."); return; }
    if (password !== confirm) { setError("비밀번호가 일치하지 않습니다."); return; }

    setIsLoading(true);
    try {
      await signUp(email, password, name);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-accent-600 text-2xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-surface-900 mb-2">가입 완료</h2>
          <p className="text-surface-500 text-sm mb-6">
            입력하신 이메일로 확인 메일이 발송되었습니다.<br />
            이메일 인증 후 로그인하세요.
          </p>
          <Button variant="primary" size="md" onClick={() => navigate("/login")}>
            로그인 화면으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 bg-primary-900 flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-400 rounded-lg flex items-center justify-center text-white font-bold text-lg">좋</div>
          <div>
            <div className="text-white font-bold text-sm">좋은문화병원</div>
            <div className="text-primary-300 text-[11px]">Energy Management</div>
          </div>
        </div>
        <div>
          <h1 className="text-white text-3xl font-bold leading-snug mb-4">
            절약위원회<br />계정 만들기
          </h1>
          <p className="text-primary-300 text-sm leading-relaxed">
            위원회 구성원으로 등록하면<br />
            점검 데이터 입력 및 조회가 가능합니다.
          </p>
        </div>
        <div className="text-primary-500 text-xs">© 2026 좋은문화병원 절약위원회</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-surface-50 px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary-700 rounded-md flex items-center justify-center text-white font-bold text-sm">좋</div>
            <span className="text-primary-800 font-bold">좋은문화병원 절약위원회</span>
          </div>

          <h2 className="text-2xl font-bold text-surface-900 mb-1">회원가입</h2>
          <p className="text-surface-500 text-sm mb-8">계정 정보를 입력하세요</p>

          {error && (
            <div role="alert" className="mb-4 p-3 text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5" htmlFor="name">이름</label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="홍길동"
                required
                autoComplete="name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5" htmlFor="email">이메일</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@hospital.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5" htmlFor="password">비밀번호 <span className="text-surface-400 font-normal">(6자 이상)</span></label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                required
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5" htmlFor="confirm">비밀번호 확인</label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="비밀번호 재입력"
                required
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "처리 중..." : "가입하기"}
            </Button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            이미 계정이 있으신가요?{" "}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
