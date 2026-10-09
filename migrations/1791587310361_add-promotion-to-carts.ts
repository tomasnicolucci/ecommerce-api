import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder): void => {
    pgm.addColumn("carts", {
        promotion_code: {
            type: "varchar(64)"
        }
    });
};

export const down = (pgm: MigrationBuilder): void => {
    pgm.dropColumn("carts", "promotion_code");
};