# NestJS Passport & AuthGuard 치트 시트

## 1. 아키텍처 흐름
```text
[요청] ──> AuthGuard ──> Passport 엔진 (본문 데이터 추출) ──> Strategy (validate) ──> AuthService (DB 검증)
                                                                    │
[컨트롤러] <── (req.user 주입) ──────────────────────────────────────┘
```

## 2. 가드 바리에이션 (Guard Variations)

### 바리에이션 1: 인라인 직접 부착 (Inline Guard)
* **개념**: 라이브러리 가드를 컨트롤러에 직접 선언.
* **코드**:
  ```typescript
  @UseGuards(AuthGuard('local'))
  @Post('login')
  login(@Request() req) { return req.user; }
  ```

### 바리에이션 2: 커스텀 클래스 상속 (Subclassed Guard) - 추천
* **개념**: `AuthGuard`를 상속한 고유 클래스를 정의하여 매직 스트링 제거.
* **코드**:
  ```typescript
  // local-auth.guard.ts
  @Injectable()
  export class LocalAuthGuard extends AuthGuard('local') {}

  // controller.ts
  @UseGuards(LocalAuthGuard)
  @Post('login')
  ```

### 바리에이션 3: 메서드 오버라이딩 (Custom Pre/Post Hooks)
* **개념**: 인증 전처리(IP 검증 등) 또는 후처리(응답 커스텀) 로직 개입.
* **코드**:
  ```typescript
  @Injectable()
  export class JwtAuthGuard extends AuthGuard('jwt') {
    async canActivate(context: ExecutionContext) {
      // 전처리 로직 (예: IP 검사)
      return super.canActivate(context) as boolean;
    }

    handleRequest(err, user, info) {
      // 후처리 로직 (예: 커스텀 401 에러 응답)
      if (err || !user) throw err || new UnauthorizedException('커스텀 에러 메시지');
      return user;
    }
  }
  ```

### 바리에이션 4: 전역 가드 + 메타데이터 예외 처리 (Secure by Default)
* **개념**: 전체 API 기본 차단 후, 특정 라우트만 `@Public()`으로 우회 허용.
* **코드**:
  ```typescript
  // public.decorator.ts
  export const Public = () => SetMetadata('isPublic', true);

  // jwt-auth.guard.ts
  @Injectable()
  export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) { super(); }

    async canActivate(context: ExecutionContext) {
      const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);
      if (isPublic) return true; // 패스
      return super.canActivate(context) as boolean;
    }
  }

  // app.module.ts
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }]

  // controller.ts
  @Public() @Post('login') // 인증 제외
  @Get('me') // 자동 보호 작동
  ```

### 바리에이션 5: 다중 가드 병합 (Auth + Roles)
* **개념**: 인증(JWT)과 인가(역할) 검증을 하나의 가드로 묶어 단일 데코레이터로 단순화.
* **코드**:
  ```typescript
  @Injectable()
  export class JwtRolesGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) { super(); }

    async canActivate(context: ExecutionContext) {
      const isAuthenticated = await super.canActivate(context);
      if (!isAuthenticated) return false;

      const roles = this.reflector.getAllAndOverride<string[]>('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
      if (!roles) return true;

      const req = context.switchToHttp().getRequest();
      return roles.some((role) => req.user.roles?.includes(role));
    }
  }
  ```

## 3. 요약 및 쓰임새

| 바리에이션 | 주 용도 | 장점 | 고려사항 |
| :--- | :--- | :--- | :--- |
| **인라인** | 빠른 프로토타이핑 | 추가 작업 없음 | 문자열 하드코딩 중복 |
| **상속 가드** | 일반적인 API 보안 적용 | 타입 안정성, 깔끔함 | 가드 클래스 파일 생성 필요 |
| **오버라이딩** | 응답 메시지 세부 제어 | 인증 전후 흐름 제어 | 부모의 생명주기 이해 필요 |
| **전역 가드** | 실제 실무 프로덕션 환경 | 인증 누락 보안 사고 방지 | 초반 보일러플레이트 설정 필요 |
| **병합 가드** | 인증 + 인가 동시 제어 | 데코레이터 선언 최소화 | 인증과 권한 역할의 결합 |
