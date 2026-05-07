import findProcess from "find-process";

export interface ServiceInfo {
  port: number;
  pid: number;
  name: string;
}

export interface ProcessResult {
  running: ServiceInfo[];
  expected_but_missing: number[];
}

export async function getRunningServices(
  expectedPorts: number[]
): Promise<ProcessResult> {
  const checks = await Promise.allSettled(
    expectedPorts.map(async (port) => {
      try {
        const results = await findProcess("port", port);
        if (results.length > 0) {
          const first = results[0];
          return {
            running: {
              port,
              pid: first.pid,
              name: first.name,
            } as ServiceInfo,
            missing: null as number | null,
          };
        }
        return {
          running: null as ServiceInfo | null,
          missing: port,
        };
      } catch {
        return {
          running: null as ServiceInfo | null,
          missing: port,
        };
      }
    })
  );

  const running: ServiceInfo[] = [];
  const expected_but_missing: number[] = [];

  for (const check of checks) {
    if (check.status === "fulfilled") {
      if (check.value.running) {
        running.push(check.value.running);
      } else if (check.value.missing !== null) {
        expected_but_missing.push(check.value.missing);
      }
    }
  }

  return { running, expected_but_missing };
}
