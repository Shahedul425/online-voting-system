import { toAppError } from "../ErrorHandling/appError.js";

export function withUnwrap(resultPromise) {
    return resultPromise.then((res) => {
        if (res?.ok) return res.data;
        throw toAppError(res);
    });
}
