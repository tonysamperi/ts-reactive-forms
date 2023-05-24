import {Observable} from "rxjs";

export type EmailValidationProvider = (value: string) => Observable<boolean>;
