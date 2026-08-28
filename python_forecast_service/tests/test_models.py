import unittest
import pandas as pd
from app.models import CrostonModel, MovingAverage, TSBModel


class ForecastModelTests(unittest.TestCase):
    def setUp(self):
        self.train = pd.DataFrame({"period": pd.date_range("2025-01-01", periods=6, freq="MS"), "quantity": [10, 10, 10, 10, 10, 10]})

    def test_common_interface_and_horizon(self):
        result = MovingAverage().forecast(self.train, 3, {"window": 3})
        self.assertEqual(len(result), 3)
        self.assertTrue((result["predicted_qty"] == 10).all())

    def test_croston_intermittent_model(self):
        result = CrostonModel().forecast(self.train.assign(quantity=[0, 10, 0, 0, 10, 0]), 2, {})
        self.assertEqual(len(result), 2)
        self.assertIsNotNone(result.iloc[0]["predicted_qty"])

    def test_no_demand_preserves_unavailable(self):
        result = TSBModel().forecast(self.train.assign(quantity=0), 2, {})
        self.assertTrue(result["predicted_qty"].isna().all())


if __name__ == "__main__":
    unittest.main()
