/**
 * Class that represents a runtime error.
 * Formats and outputs the error message in a consistent way.
 *
 * Example:
 * ```
 *  throw new RuntimeError(
 *    FormsRuntimeErrorCodes.INJECTOR_ALREADY_DESTROYED,
 *    ngDevMode && 'Injector has already been destroyed.');
 * ```
 *
 * Note: the `message` argument contains a descriptive error message as a string in development
 * mode (when the `ngDevMode` is defined). In production mode (after tree-shaking pass), the
 * `message` argument becomes `false`, thus we account for it in the typings and the runtime logic.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class ɵRuntimeError<T extends number = number> extends Error {
    code!: T;

    constructor(code: T, message: null | false | string) {
        super();
    }
}
