import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://deginpwtznmdwnnnbwsj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZ2lucHd0em5tZHdubm5id3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5Nzc3NjUsImV4cCI6MjA5MTU1Mzc2NX0.OBSnAAwkKbvLxkV0WDupUhcxQKXPH4tREi4i64kqsAw";

const supabase = createClient(supabaseUrl, supabaseKey);

const NEW_CONTRACT_ADDRESS = "0xe39e40D5d36E615E55Bb959235F87BD4EA0680D1";

async function updateContractAddress() {
  console.log("Finding organizations...");
  
  const { data: orgs, error } = await supabase
    .from("organizations")
    .select("id, name, contract_address");
  
  if (error) {
    console.error("Error fetching orgs:", error);
    process.exit(1);
  }
  
  console.log("Found organizations:", orgs);
  
  if (orgs && orgs.length > 0) {
    for (const org of orgs) {
      console.log(`Updating org ${org.name} (${org.id}) with new contract: ${NEW_CONTRACT_ADDRESS}`);
      
      const { error: updateError } = await supabase
        .from("organizations")
        .update({ 
          contract_address: NEW_CONTRACT_ADDRESS.toLowerCase(),
          contract_deployed_at: new Date().toISOString()
        })
        .eq("id", org.id);
      
      if (updateError) {
        console.error("Error updating org:", updateError);
      } else {
        console.log(`Updated ${org.name} successfully!`);
      }
    }
  } else {
    console.log("No organizations found");
  }
}

updateContractAddress()
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });