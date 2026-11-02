import { Router } from "express";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { env } from "../../../../config/env.js";
import { SyncAuthUser } from "../../application/services/sync-auth-user.js";

const router = Router();
const syncAuthUser = new SyncAuthUser();

const syncSchema = z.object({
    authUserId: z.string().uuid()
});

function validInternalSecret(provided: string | undefined): boolean {
    if (!provided || !env.INTERNAL_SERVICE_SECRET) {
        return false;
    }

    const actual = Buffer.from(provided);
    const expected = Buffer.from(env.INTERNAL_SERVICE_SECRET);

    return (
        actual.length === expected.length &&
        timingSafeEqual(actual, expected)
    );
}

router.post("/users/sync", async (req, res, next) => {
    try {
        if (!env.INTERNAL_SYNC_ENABLED) {
            res.status(404).json({
                message: "Internal synchronization is disabled"
            });
            return;
        }

        if (!validInternalSecret(req.header("x-internal-service-key"))) {
            res.status(401).json({
                message: "Unauthorized internal request"
            });
            return;
        }

        const parsed = syncSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({
                message: "Invalid synchronization payload"
            });
            return;
        }

        const result = await syncAuthUser.execute(
            parsed.data.authUserId
        );

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

export const internalAuthRouter = router;