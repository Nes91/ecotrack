-- DropForeignKey
ALTER TABLE "route_stops" DROP CONSTRAINT "route_stops_routeId_fkey";

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
