"use client";
import Loader from "@/components/ui/Loader";
import { getAllMeals } from "@/helpers/client/meal";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import MealCard from "./MealCard";
import { IMeal } from "@/models/meal.model";
import { UserRole } from "@/constants/enum";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import useCurrentUser from "@/hooks/useCurrentUser";

function MealsContainer() {
  const { userRole } = useCurrentUser();
  const isAdmin = userRole === UserRole.admin;
  const options = {
    ...(!isAdmin && { isActive: true }),
  };
  const { data, error, isLoading } = useQuery({
    queryKey: ["getAllMeals", options],
    queryFn: () => getAllMeals(options),
    refetchOnWindowFocus: false,
  });

  if (error) {
    toast.error(error.message);
    return <div>{error.message}</div>;
  }
  if (isLoading) {
    return <Loader />;
  }
  const meals = data?.meals;
  if (meals.length > 0) {
    return (
      <div className="container mx-auto my-4">
        <h1 className="font-bold py-2">Meals </h1>
        <div className=" w-full grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6 justify-center md:px-4 ">
          {meals.map((meal: IMeal) => (
            <MealCard listOnly key={String(meal._id)} meal={meal} />
          ))}
        </div>

        {isAdmin && (
          <div className="fixed right-4 bottom-24 md:bottom-10">
            <AddNewMealButton />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto my-4">
        <h1 className="font-bold py-2">Meals </h1>
        <div className=" w-full grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6 justify-center md:px-4 ">
          <div className="text-center">No meals found</div>
          {isAdmin && (
            <div className="fixed right-4 bottom-24 md:bottom-10">
              <AddNewMealButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddNewMealButton() {
  return (
    <Button asChild size={"icon"} className=" w-10 h-10">
      <Link href={"/dashboard/meals/add"}>
        <Plus className="w-full h-full"></Plus>
      </Link>
    </Button>
  );
}

export default MealsContainer;
