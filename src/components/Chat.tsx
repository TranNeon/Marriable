import type {
    IntersectAllValidatorInputs,
    OptionalFetcher,
    RequestMiddlewareAfterServer,
    RequiredFetcher
} from "@tanstack/react-start";
import type {Writeable} from "zod/v3";
import type {ZodInt, ZodNonOptional} from "zod";
import type {$strip} from "zod/v4/core";
import HoverSelect from "#/components/hover-select.tsx";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Chat(props: {
    histories: [awaited undefined extends IntersectAllValidatorInputs<TMiddlewares extends ReadonlyArray<any> ? (RequestMiddlewareAfterServer<{}, undefined, {
        user: any
    }>[] extends ReadonlyArray<any> ? readonly [...TMiddlewares, ...RequestMiddlewareAfterServer<{}, undefined, {
        user: any
    }>[]] : TMiddlewares) : RequestMiddlewareAfterServer<{}, undefined, { user: any }>[], ZodObject<Writeable<{
        projId: ZodNonOptional<ZodInt>
    }>, $strip>> ? OptionalFetcher<TMiddlewares extends ReadonlyArray<any> ? (RequestMiddlewareAfterServer<{}, undefined, {
        user: any
    }>[] extends ReadonlyArray<any> ? readonly [...TMiddlewares, ...RequestMiddlewareAfterServer<{}, undefined, {
        user: any
    }>[]] : TMiddlewares) : RequestMiddlewareAfterServer<{}, undefined, { user: any }>[], ZodObject<Writeable<{
        projId: ZodNonOptional<ZodInt>
    }>, $strip>, unknown> : RequiredFetcher<TMiddlewares extends ReadonlyArray<any> ? (RequestMiddlewareAfterServer<{}, undefined, {
        user: any
    }>[] extends ReadonlyArray<any> ? readonly [...TMiddlewares, ...RequestMiddlewareAfterServer<{}, undefined, {
        user: any
    }>[]] : TMiddlewares) : RequestMiddlewareAfterServer<{}, undefined, { user: any }>[], ZodObject<Writeable<{
        projId: ZodNonOptional<ZodInt>
    }>, $strip>, unknown> extends ((...args: any) => infer R) ? R : any][awaited undefined extends IntersectAllValidatorInputs<TMiddlewares extends ReadonlyArray<any> ? (RequestMiddlewareAfterServer<{}, undefined, {
        user: any
    }>[] extends ReadonlyArray<any> ? readonly [...TMiddlewares, ...RequestMiddlewareAfterServer<{}, undefined, {
        user: any
    }>[]] : TMiddlewares) : RequestMiddlewareAfterServer<{}, undefined, { user: any }>[], ZodObject<Writeable<{
        projId: ZodNonOptional<ZodInt>
    }>, $strip>> ? OptionalFetcher<TMiddlewares extends ReadonlyArray<any> ? (RequestMiddlewareAfterServer<{}, undefined, {
        user: any
    }>[] extends ReadonlyArray<any> ? readonly [...TMiddlewares, ...RequestMiddlewareAfterServer<{}, undefined, {
        user: any
    }>[]] : TMiddlewares) : RequestMiddlewareAfterServer<{}, undefined, { user: any }>[], ZodObject<Writeable<{
        projId: ZodNonOptional<ZodInt>
    }>, $strip>, unknown> : RequiredFetcher<TMiddlewares extends ReadonlyArray<any> ? (RequestMiddlewareAfterServer<{}, undefined, {
        user: any
    }>[] extends ReadonlyArray<any> ? readonly [...TMiddlewares, ...RequestMiddlewareAfterServer<{}, undefined, {
        user: any
    }>[]] : TMiddlewares) : RequestMiddlewareAfterServer<{}, undefined, { user: any }>[], ZodObject<Writeable<{
        projId: ZodNonOptional<ZodInt>
    }>, $strip>, unknown> extends ((...args: any) => infer R) ? R : any extends any ? 0 : never] | undefined,
    callbackfn: (history) => { name: any; value: any },
    action: (value: any) => void,
    loading: false | true | boolean,
    onClick: () => Promise<void>,
    loadedHistory: {},
    callbackfn1: (msg, i) => JSX.Element,
    streamingResponse: string,
    action1: (formData: FormData) => Promise<void>
}) {
    return <div className="flex h-full flex-col overflow-auto">
        {props.histories && (
            <HoverSelect
                items={props.histories.map(props.callbackfn)}
                action={props.action}
            />
        )}
        {props.loading && <span>Loading...</span>}
        <Button
            onClick={props.onClick}
        >
            New HISTORY IMMEDIATELY
        </Button>
        {/*OK THIS IS WHERE THE DAMN MESSAGES GONNA BE DISPLAYED*/}
        <ol className="flex-1 overflow-auto">
            {props.loading && <li className="p-5 m-5">Loading chat...</li>}

            {!props.loading && !props.loadedHistory?.[0]?.content?.length && (
                <li className="flex items-center justify-center h-full">
                    <div>No chat Session, select or start new</div>
                </li>
            )}

            {props.loadedHistory?.[0]?.content?.map(props.callbackfn1)}

            {props.streamingResponse && (
                <li className="bg-amber-100 mr-25">
                    <strong>streaming ai: </strong>
                    <Markdown remarkPlugins={[remarkGfm]}>
                        {props.streamingResponse}
                    </Markdown>
                </li>
            )}
        </ol>
        <form
            className=" flex gap-2 border-t p-4"
            action={props.action1}
        >
            <Input name="msg" placeholder="message here"/>
            <Button type="submit"> Send msg</Button>
        </form>
    </div>
}