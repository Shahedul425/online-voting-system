// Helps apply backend field errors to your local form error state
export function mergeFieldErrors(current, appError) {
    if (!appError?.fieldErrors) return current;
    return { ...current, ...appError.fieldErrors };
}
