import { Button, Container, TextField } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";
import { useState } from "react";
import { createTransaction, ensureGasCoins, validateTransaction } from "./utils/transaction";

export function CreateJournal({
  onCreated,
}: {
  onCreated: (id: string) => void;
}) {
  const journalPackageId = useNetworkVariable("journalPackageId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const [title, setTitle] = useState("");
  const {
    mutate: signAndExecute,
    isSuccess,
    isPending,
  } = useSignAndExecuteTransaction();

  async function create() {
    if (!currentAccount) return;

    try {
      /**
       * Task 1:
       *
       * Create a new Transaction instance with proper gas configuration.
       */
      const tx = createTransaction({
        gasBudget: 100000000, // 0.1 SUI
        gasPrice: 1000
      });

      /**
       * Task 2: 
       * 
       * Execute a call to the `journal::new_journal` function to create a new journal. 
       * 
       * Make sure to use the title input from the user
       */
      const journal = tx.moveCall({
        target: `${journalPackageId}::journal::new_journal`,
        arguments: [tx.pure.string(title)]
      });

      /**
       * Task 3: 
       * 
       * Transfer the new Journal object to the connected user's address
       * 
       * Hint: use currentAccount.address to the user's address
       */
      tx.transferObjects([journal], currentAccount.address);

      // Validate transaction before sending
      const validation = validateTransaction(tx);
      if (!validation.valid) {
        console.error("Transaction validation failed:", validation.errors);
        alert(`Transaction validation failed: ${validation.errors.join(", ")}`);
        return;
      }

      // Ensure we have sufficient gas coins
      await ensureGasCoins(suiClient, currentAccount.address, tx);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async ({ digest }) => {
            const { effects } = await suiClient.waitForTransaction({
              digest: digest,
              options: {
                showEffects: true,
              },
            });

            onCreated(effects?.created?.[0]?.reference?.objectId!);
          },
          onError: (error) => {
            console.error("Transaction failed:", error);
            alert(`Transaction failed: ${error.message}`);
          }
        },
      );
    } catch (error) {
      console.error("Error creating journal:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return (
    <Container>
      <TextField.Root
        placeholder="Enter journal title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        size="3"
        mb="3"
      />
      <Button
        size="3"
        onClick={() => {
          create();
        }}
        disabled={isSuccess || isPending || !title.trim()}
      >
        {isSuccess || isPending ? <ClipLoader size={20} /> : "Create Journal"}
      </Button>
    </Container>
  );
}
