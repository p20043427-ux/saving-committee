import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { HospitalLogo } from "@/src/components/ui/HospitalLogo";

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Email not confirmed")) {
        setError("이메일 인증이 완료되지 않았습니다. 받은 편지함을 확인해 주세요.");
      } else if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (msg.includes("Too many requests")) {
        setError("로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.");
      } else {
        setError("로그인 중 오류가 발생했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 bg-primary-900 flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <HospitalLogo size={48} showText={false} variant="symbol" />
          <div>
            <div className="text-white font-bold text-sm">좋은문화병원</div>
            <div className="text-primary-300 text-[11px]">은성의료재단</div>
          </div>
        </div>
        <div>
          <h1 className="text-white text-3xl font-bold leading-snug mb-4">
            에너지 절약<br />점검 관리 시스템
          </h1>
          <p className="text-primary-300 text-sm leading-relaxed">
            건물·부서 단위 에너지 절약 활동을<br />
            체계적으로 점검하고 관리합니다.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {["점검표 실시간 입력", "부서별 현황 모니터링", "연간 분석 리포트"].map(t => (
              <div key={t} className="flex items-center gap-3 text-primary-200 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-400 shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>
        <div className="text-primary-500 text-xs">© 2026 좋은문화병원 절약위원회</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-surface-50 px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <HospitalLogo size={36} showText={false} variant="symbol" />
            <div>
              <div className="text-primary-800 font-bold text-sm">좋은문화병원</div>
              <div className="text-primary-500 text-[10px]">은성의료재단 절약위원회</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-surface-900 mb-1">로그인</h2>
          <p className="text-surface-500 text-sm mb-8">계정 정보를 입력하세요</p>

          {error && (
            <div role="alert" className="mb-4 p-3 text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-medium text-surface-700 mb-1.5" htmlFor="password">비밀번호</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            계정이 없으신가요?{" "}
            <Link to="/signup" className="text-primary-600 font-semibold hover:underline">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
