import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appDebounceClick]',
})
export class DebounceClickDirective {
  /** Emits a click, same as native (click), but only if not already busy. */
  @Output() appDebounceClick = new EventEmitter<MouseEvent>();

  private busy = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {}

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.busy) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    this.appDebounceClick.emit(event);
  }

  /** Call this from the component after starting an async action, and again
   *  when it resolves — locks the button for the duration. */
  setBusy(value: boolean): void {
    this.busy = value;
    if (value) {
      this.renderer.setAttribute(this.el.nativeElement, 'disabled', 'true');
    } else {
      this.renderer.removeAttribute(this.el.nativeElement, 'disabled');
    }
  }
}
