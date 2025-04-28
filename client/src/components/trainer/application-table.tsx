import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { Fragment } from "react";

interface Application {
  id: number;
  status: string;
  created_at: string;
  requirement?: {
    id: number;
    title: string;
    status: string;
  };
  college?: {
    id: number;
    name: string;
    organization?: string;
  };
}

interface TrainerApplicationTableProps {
  applications: Application[];
}

export default function TrainerApplicationTable({ applications }: TrainerApplicationTableProps) {
  // Function to get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "applied":
        return "default";
      case "shortlisted":
        return "warning";
      case "accepted":
        return "success";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-neutral-200">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Date Applied</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell className="font-medium">
                  {application.requirement?.title || "Unknown Course"}
                </TableCell>
                <TableCell>
                  {application.college?.name || "Unknown Institution"}
                </TableCell>
                <TableCell>
                  {format(new Date(application.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(application.status)} className="capitalize">
                    {application.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {application.status === "accepted" ? (
                    <Link href="/contracts">
                      <Button variant="link" className="text-primary-600 hover:text-primary-900 p-0 h-auto">
                        View Contract
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="link" className="text-primary-600 hover:text-primary-900 p-0 h-auto">
                      View Details
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            
            {applications.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-neutral-500">
                  No applications found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
