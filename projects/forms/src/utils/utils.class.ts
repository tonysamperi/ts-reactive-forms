
export class Utils {

    static get EMAIL_DENIED_CHARS(): string {
        return "\\\\|!\"£$%&/()='?^€*[\\]°#§<>,;:\\s";
    }

    static get EMAIL_RE(): RegExp {
        return new RegExp("^[^" + this.EMAIL_DENIED_CHARS + "]+@[a-z0-9.-]+\\.[a-z]{2,4}$");
    }

    static isArrayOrError(val: any, withMessage?: string): void {
        if (!Array.isArray(val)) {
            throw new Error(withMessage || "Utils => val was not an array");
        }
    }

    static isEmpty(val: any): boolean {
        return !val && val !== 0;
    }


    static isInstanceOrError<T = any>(val: any, klass: new (...args: any[]) => T, withMessage?: string): void {
        if (!(val instanceof klass)) {
            throw new Error(withMessage || "Utils => val was not instance of class");
        }
    }

    static isNotEmpty(val: any): boolean {
        return !this.isEmpty(val);
    }

    static isString(entity: any): entity is string {
        return typeof entity === typeof "";
    }

    static isTruthyOrError(condition: any, withMessage?: string): void {
        if (!condition) {
            throw new Error(withMessage || "Utils => condition wasn't truthy");
        }
    }

}
