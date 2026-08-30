export const conceptOverrides = {
  135: {
    title: 'Singleton Pattern',
    definition:
      'Restrict a class to one instance and give callers a globally reachable way to obtain that instance. This is the classic Gang of Four pattern, not a dependency-injection lifetime.',
    look_for:
      'A class controls its own construction, stores its sole instance, and exposes that instance through a static or otherwise global access point.',
    csharp_expanded: `public sealed class ProcessRegistry
{
    private static readonly ProcessRegistry _instance =
        new ProcessRegistry();

    private readonly Dictionary<string, int> _processIds;

    private ProcessRegistry()
    {
        _processIds = new Dictionary<string, int>();
    }

    public static ProcessRegistry Instance
    {
        get { return _instance; }
    }

    public void Register(string name, int processId)
    {
        _processIds[name] = processId;
    }
}

ProcessRegistry.Instance.Register("worker", 42);`,
    csharp_shorthand: `public sealed class ProcessRegistry
{
    public static ProcessRegistry Instance { get; } = new();

    private ProcessRegistry() { }
}`,
    python_expanded: `class ProcessRegistry:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._process_ids = {}
        return cls._instance

    def register(self, name, process_id):
        self._process_ids[name] = process_id


registry = ProcessRegistry()
registry.register("worker", 42)`,
    python_shorthand: null,
    walkthrough:
      '`ProcessRegistry` prevents ordinary construction, stores one instance, and supplies a global access point through `Instance`. Those three responsibilities make the C# example the classic Singleton pattern. The Python example illustrates the same identity rule during ordinary sequential construction through `__new__`; its unsynchronized first access is not safe under concurrency, and a module often provides shared process-local state with less ceremony. The pattern does not guarantee one instance across machines, processes, containers, or tenants. It also makes the dependency easy to reach from anywhere, which hides coupling and complicates isolated tests. A singleton lifetime solves a different problem: a composition root or dependency-injection container creates one object and reuses it while consumers continue to receive that object explicitly.',
    caution:
      'Global access can hide dependencies and turn mutable state into process-wide coupling. Define what “one” means, make first construction thread-safe when access can race, and do not use this pattern when explicit ownership is available.',
    related:
      'Related: Singleton Lifetime; Dependency Injection; Hidden Global State; Mutable Shared State',
    modern_note:
      'The name “singleton” is also used for a container lifetime. Ask whether the speaker means the classic global-access pattern or one reused dependency instance.',
  },
};
