import {AbstractControlComponent} from "../components/abstract-control.component";
import {ControlContainer} from "./control-container.class";
import {ControlValueAccessor} from "./control-value-accessor.class";

/**
 * @description
 * A base class that all `FormControl`-based directives extend. It binds a `FormControl`
 * object to a DOM element.
 *
 * @publicApi
 */
export abstract class Control extends AbstractControlComponent {
    /**
     * @description
     * The parent form for the control.
     *
     * @internal
     */
        // eslint-disable-next-line @typescript-eslint/naming-convention
    _parent: ControlContainer | null = null;

    /**
     * @description
     * The name for the control
     */
    name: string | number | null = null;

    /**
     * @description
     * The value accessor for the control
     */
    valueAccessor: ControlValueAccessor | null = null;

    /**
     * @description
     * The callback method to update the model from the view when requested
     *
     * @param newValue The new value for the view
     */
    abstract viewToModelUpdate(newValue: any): void;
}
