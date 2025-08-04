

export type APIResponse<T = undefined> = {
    success: boolean,
    message: string,
    data?: T,
}