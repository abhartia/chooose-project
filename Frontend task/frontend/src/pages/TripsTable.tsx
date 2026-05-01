import { TripSummary } from "@/api/generated";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function TripsTable({ trips }: { trips: TripSummary[] }) {
    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {trips.map((trip) => (
                        <TableRow key={trip.id}>
                            <TableCell>{trip.title}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}