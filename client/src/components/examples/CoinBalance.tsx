import { CoinBalance } from "../CoinBalance";

export default function CoinBalanceExample() {
  return (
    <div className="p-4">
      <CoinBalance balance={15000} />
    </div>
  );
}
