type RequestFunction<T1, R> = (args: T1) => Promise<R>;
type MergeFunction<T1, T2> = (requests: T2[]) => T1;

interface RequestParams<T> {
  args: T;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}
export class BatchRequester<T1, T2 = T1, R = any> {
  private requests: RequestParams<T2>[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly requestFunction: RequestFunction<T1, R>,
    private readonly mergeFunction: MergeFunction<T1, T2>,
    private readonly waitTime: number = 100,
  ) {}

  request(args: T2): Promise<R> {
    return new Promise((resolve, reject) => {
      this.requests.push({ args, resolve, reject });

      if (!this.timer) {
        this.timer = setTimeout(async () => {
          this.timer = null;

          const requests = this.requests;
          this.requests = [];

          try {
            const mergedArgs = this.mergeFunction(requests.map((request) => request.args));
            const result = await this.requestFunction(mergedArgs);
            requests.forEach(({ resolve }) => resolve(result));
          } catch (error) {
            requests.forEach(({ reject }) => reject(error));
          }
        }, this.waitTime);
      }
    });
  }
}
