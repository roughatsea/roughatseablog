export const supplementalConcepts = [
  {
    slug: 'singleton-lifetime',
    index: null,
    position: 135.5,
    title: 'Singleton Lifetime',
    tier: 'CORE',
    tier_label: 'Core working vocabulary',
    source_tag: 'MODERN PLATFORM VOCABULARY',
    definition:
      'A singleton lifetime is an ownership rule: a composition root or container creates one instance and reuses it for the lifetime of that owner. Consumers can still receive the dependency explicitly.',
    look_for:
      'Several consumers receive the same service instance because the composition root deliberately registered or constructed it once, without asking the service class for a global instance.',
    csharp_expanded: `// Composition root
IClock sharedClock = new SystemClock();

TokenService tokenService = new TokenService(sharedClock);
AuditService auditService = new AuditService(sharedClock);

public sealed class TokenService
{
    private readonly IClock _clock;

    public TokenService(IClock clock)
    {
        _clock = clock;
    }
}

public sealed class AuditService
{
    private readonly IClock _clock;

    public AuditService(IClock clock)
    {
        _clock = clock;
    }
}`,
    csharp_shorthand: `services.AddSingleton<IClock, SystemClock>();
services.AddTransient<TokenService>();
services.AddTransient<AuditService>();`,
    python_expanded: `class TokenService:
    def __init__(self, clock):
        self._clock = clock


class AuditService:
    def __init__(self, clock):
        self._clock = clock


# Composition root
shared_clock = SystemClock()

token_service = TokenService(shared_clock)
audit_service = AuditService(shared_clock)`,
    python_shorthand: null,
    walkthrough:
      'The composition root constructs one `SystemClock` and passes the same instance to `TokenService` and `AuditService`. The C# registration expresses that ownership rule through `AddSingleton`: the container creates one `IClock` per container and reuses it for dependents. Neither consumer reaches into `SystemClock` for a global `Instance`; both dependencies remain visible in their constructors. The lifetime is local to its owner, so one instance per container does not mean one per machine or cluster. Python has no built-in dependency-injection container convention, but constructing once and passing the object explicitly expresses the same lifetime.',
    caution:
      'A long lifetime can accidentally retain mutable state, request data, disposable resources, or non-thread-safe collaborators. Match the lifetime to the resource and to every dependency it retains.',
    related:
      'Related: Singleton Pattern; Dependency Injection; Composition Root; Hidden Global State',
    modern_note:
      'This is the meaning of “singleton” in APIs such as .NET dependency-injection registration. It is related to, but structurally different from, the Gang of Four Singleton pattern.',
  },
];
