import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MealLogPopulatedType } from "@/helpers/client/client.types";
import { MealStatus } from "@/constants/enum";
import { formatToIndianCurrency } from "@/lib/utils";
import { getDateAndTimeString } from "@/lib/date-format";

function MealLogCard({ mealLog }: { mealLog: MealLogPopulatedType }) {
  const { meal, totalAmount, extras, mealFor } = mealLog;
  if (!meal) return <div className="mx-auto">meal details not found</div>;
  console.log("meal", meal);
  return (
    <Card className="mt-4 max-w-2xl mx-auto">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <CardTitle className="text-lg">Meal Details</CardTitle>
          <p className="text-sm text-muted-foreground">{mealLog.description}</p>
          <Badge variant="success">{mealFor}</Badge>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <Badge
            variant={
              mealLog.status === MealStatus.taken
                ? "secondary"
                : mealLog.status === MealStatus.not_taken
                  ? "outline"
                  : "destructive"
            }
            className="capitalize"
          >
            {mealLog.status}
          </Badge>

          {/* Small meta */}
          <div className="text-xs text-muted-foreground">
            <div>Logged: {getDateAndTimeString(mealLog.createdAt!)}</div>
            <div>Date: {getDateAndTimeString(mealLog.date)}</div>
            <div className="mt-0.5">
              Meal ID: <span className="font-medium">{String(meal?._id)}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-4">
        {/* Meal top row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold">{String(meal.name)}</h4>

            <p className="text-xs text-muted-foreground">{meal.description}</p>
            <p className="text-xs text-muted-foreground">
              Meal SKU / reference:{" "}
              <span className="font-medium">{String(meal._id)}</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium">Base Price</p>
            <p className="text-lg">{formatToIndianCurrency(meal.price)}</p>
          </div>
        </div>

        <Separator />

        {/* Price breakdown */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Price breakdown</p>

          <ul className=" list-inside space-y-1 text-sm text-muted-foreground">
            <li className="w-full flex justify-between">
              <span className="inline-block w-36 text-foreground">
                Base Price
              </span>
              <span className="font-medium">
                {formatToIndianCurrency(meal.price)}
              </span>
            </li>

            {extras && extras.length > 0 ? (
              <>
                <li>
                  <div className="text-foreground font-medium">Extras</div>
                  <ul className=" mt-1 space-y-1">
                    {extras.map((extra) => (
                      <li
                        key={String(extra.details._id)}
                        className="flex justify-between gap-4"
                      >
                        <div>
                          <span className="inline-block w-28">
                            {extra.details.name}
                          </span>{" "}
                          <span>
                            {extra.details.price} x {extra.quantity}
                          </span>
                        </div>
                        <span className="font-medium">
                          {formatToIndianCurrency(
                            mealLog.priceBreakdown?.extrasTotal as number,
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              </>
            ) : (
              <li className="text-muted-foreground">No extras</li>
            )}
          </ul>
        </div>

        <Separator />

        {/* Totals row */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Logged At</div>
          <div className="text-sm font-medium">
            {getDateAndTimeString(mealLog.createdAt!)}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Total Amount</div>
          <div className="text-xl font-bold">
            {formatToIndianCurrency(totalAmount)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MealLogCard;
