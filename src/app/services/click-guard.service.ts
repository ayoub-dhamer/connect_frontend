import { Injectable } from '@angular/core';
import { Observable, finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClickGuardService {
  private pending = new Set<string>();

  /** Runs `factory()` only if the given key isn't already in flight.
   *  Returns true if the call was allowed to start, false if blocked. */
  guard<T>(
    key: string,
    factory: () => Observable<T>,
    onResult: (result: T) => void,
    onError?: (err: any) => void,
  ): boolean {
    if (this.pending.has(key)) return false;

    this.pending.add(key);
    factory()
      .pipe(finalize(() => this.pending.delete(key)))
      .subscribe({
        next: onResult,
        error: (err) => {
          if (onError) onError(err);
          else console.error(err);
        },
      });
    return true;
  }

  isPending(key: string): boolean {
    return this.pending.has(key);
  }
}
