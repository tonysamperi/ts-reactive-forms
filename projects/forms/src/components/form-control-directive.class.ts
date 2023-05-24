import {AbstractControl} from "../models/abstract-control.class";
//
import {fromEvent, Observable, Subject, takeUntil} from "rxjs";

// Override event for value change, default is "input"
enum Evts {
    CHECKBOX = "change",
    INPUT = "",
    RADIO = "change",
    SELECT = "change",
    TEXT = "input",
    TEXTAREA = "input"
}

export class FormControlDirectiveController<T extends HTMLInputElement> {

    get destroy$(): Observable<void> {
        return this._destroy$.asObservable();
    }

    private _ctrl: AbstractControl;
    private _destroy$: Subject<void> = new Subject<void>();
    private _el: T;

    constructor(el: T, ctrl: AbstractControl) {
        this._el = el;
        this._ctrl = ctrl;
        this._handleBlur();
        this._handleInput();
    }

    private _bindEvent(eventName: string, next: (event: Event) => void): void {
        fromEvent(this._el, eventName)
            .pipe(takeUntil(this._destroy$))
            .subscribe({
                           next
                       });
    }

    private _getInputEventName(): string {
        const tagName = this._el.tagName as keyof typeof Evts;
        const evtKey = (this._el.getAttribute("type") || "text").toUpperCase() as keyof typeof Evts;

        return (tagName === "INPUT" ? Evts[evtKey] : Evts[tagName]) || Evts.TEXT;
    }

    private _handleBlur(): void {
        this._bindEvent("blur", () => {
            this._ctrl.markAsTouched();
            // this._ctrl.updateValueAndValidity();
        });
    }

    private _handleInput(): void {
        this._ctrl.setValue(this._el.value);
        this._bindEvent(this._getInputEventName(), (e: Event) => {
            this._ctrl.markAsDirty();
            this._ctrl.markAsTouched();
            this._ctrl.setValue((e.target as T)?.value);
        });
    }

}
