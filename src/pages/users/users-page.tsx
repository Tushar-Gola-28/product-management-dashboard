import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";

import { useDebouncedValue } from "../../hooks/use-debounced-value";
import { toInt } from "../../lib/url";
import { cn, getPageSizeFromSettings, getTableDensityFromSettings } from "../../lib/utils";
import { getUsersPaged, searchUsers } from "../../services/user.service";

type User = {
    id?: number;
    _id?: string;

    firstName?: string;
    lastName?: string;
    maidenName?: string;

    username?: string;
    email?: string;
    phone?: string;

    image?: string;

    company?: {
        name?: string;
        department?: string;
        title?: string;
    };

    address?: {
        address?: string;
        city?: string;
        state?: string;
        postalCode?: string;
    };
};

function getId(u: User) {
    return (u._id ?? u.id) as string | number;
}



export function UsersPage() {
    const [sp, setSp] = useSearchParams();

    const LIMIT = getPageSizeFromSettings();
    const density = getTableDensityFromSettings();

    const rowClass =
        density === "compact"
            ? "h-10 text-sm"
            : "h-14 text-base";

    const cellClass =
        density === "compact"
            ? "py-2"
            : "py-4";
    const page = toInt(sp.get("page"), 1);
    const search = sp.get("search") ?? "";
    const skip = (page - 1) * LIMIT;

    const [searchInput, setSearchInput] = useState(search);
    useEffect(() => setSearchInput(search), [search]);

    const debouncedSearch = useDebouncedValue(searchInput, 300);

    useEffect(() => {
        if (debouncedSearch === search) return;

        const next = new URLSearchParams(sp);
        if (debouncedSearch) next.set("search", debouncedSearch);
        else next.delete("search");

        next.set("page", "1");
        setSp(next, { replace: true });
    }, [debouncedSearch]);

    const usersQuery = useQuery({
        queryKey: ["users", { page, skip, search }],
        queryFn: async () => {
            if (search) return searchUsers({ q: search, limit: LIMIT, skip });
            return getUsersPaged({ limit: LIMIT, skip });
        },
        keepPreviousData: true,
    });

    const isLoading = usersQuery.isLoading;
    const response = usersQuery.data;

    const users: User[] = response?.users ?? [];
    const total = response?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / LIMIT));

    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const setPage = (p: number) => {
        const next = new URLSearchParams(sp);
        next.set("page", String(Math.min(Math.max(1, p), totalPages)));
        setSp(next);
    };

    const clearFilters = () => {
        const next = new URLSearchParams();
        next.set("page", "1");
        setSp(next);
        setSearchInput("");
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">Users</h1>
                <p className="text-sm text-muted-foreground">
                    Read-only users listing with search, pagination and user details modal.
                </p>
            </div>

            <Card className="rounded-2xl">
                <CardHeader >
                    <CardTitle className="text-base">Search</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        <Input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search users (debounced 300ms)…"
                        />

                        <Button variant="ghost" aria-label="Reset" onClick={clearFilters}>
                            Reset
                        </Button>
                    </div>

                    <div className="text-sm text-muted-foreground">
                        Total: <span className="font-medium text-foreground">{total}</span>
                        {search ? (
                            <Badge className="ml-2" variant="secondary">
                                search: {search}
                            </Badge>
                        ) : null}
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">User List</CardTitle>
                </CardHeader>

                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 8 }).map((_, idx) => (
                                <div key={idx} className="flex items-center gap-3 border-b pb-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <Skeleton className="h-5 w-50" />
                                    <Skeleton className="h-5 w-50" />
                                    <Skeleton className="h-5 w-35" />
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-5 w-30" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className={rowClass}>
                                    <TableHead>Avatar</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>City</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((u) => (
                                        <TableRow
                                            key={String(getId(u))}
                                            className={cn("cursor-pointer hover:bg-muted/50", rowClass)}
                                            onClick={() => setSelectedUser(u)}
                                        >
                                            <TableCell className={cellClass}>
                                                <img
                                                    src={u.image}
                                                    alt="avatar"
                                                    className="h-10 w-10 rounded-full border object-cover"
                                                />
                                            </TableCell>

                                            <TableCell className={cn("font-medium", cellClass)}>
                                                {u.firstName} {u.lastName}
                                            </TableCell>

                                            <TableCell className={cn(cellClass)}>{u.email ?? "-"}</TableCell>
                                            <TableCell className={cn(cellClass)}>{u.phone ?? "-"}</TableCell>

                                            <TableCell className={cn(cellClass)}>
                                                {u.company?.name ? (
                                                    <Badge variant="secondary">{u.company.name}</Badge>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>

                                            <TableCell className={cn(cellClass)}>{u.address?.city ?? "-"}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}

                    {!isLoading && (
                        <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
                            <div className="text-sm text-muted-foreground">
                                Page <span className="font-medium text-foreground">{page}</span> of{" "}
                                <span className="font-medium text-foreground">{totalPages}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="outline" aria-label="Prev" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                                    Prev
                                </Button>
                                <Button variant="outline" aria-label="Next" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <img
                                    src={selectedUser.image}
                                    className="h-16 w-16 rounded-full border object-cover"
                                />

                                <div>
                                    <p className="text-lg font-bold">
                                        {selectedUser.firstName} {selectedUser.lastName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border p-3">
                                    <p className="text-xs text-muted-foreground">Phone</p>
                                    <p className="font-medium">{selectedUser.phone ?? "-"}</p>
                                </div>

                                <div className="rounded-xl border p-3">
                                    <p className="text-xs text-muted-foreground">Username</p>
                                    <p className="font-medium">{selectedUser.username ?? "-"}</p>
                                </div>
                            </div>

                            <div className="rounded-xl border p-3 space-y-2">
                                <p className="text-sm font-semibold">Address</p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedUser.address?.address ?? "-"},{" "}
                                    {selectedUser.address?.city ?? "-"},{" "}
                                    {selectedUser.address?.state ?? "-"}{" "}
                                    {selectedUser.address?.postalCode ?? ""}
                                </p>
                            </div>

                            <div className="rounded-xl border p-3 space-y-2">
                                <p className="text-sm font-semibold">Company Info</p>
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">Name:</span>{" "}
                                    {selectedUser.company?.name ?? "-"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">Department:</span>{" "}
                                    {selectedUser.company?.department ?? "-"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">Title:</span>{" "}
                                    {selectedUser.company?.title ?? "-"}
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
