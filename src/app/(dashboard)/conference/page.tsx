import { FlowBuilder } from "@/components/flow/flow-builder";
import { ViewFlows } from "@/components/flow/flow-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  return (
    <div className="flex justify-center">
      <Tabs defaultValue="flowbuilder" className="w-full max-w-6xl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="flowbuilder">Flow Builder</TabsTrigger>
          <TabsTrigger value="viewflows">View Flows</TabsTrigger>
        </TabsList>
        <TabsContent value="flowbuilder"><FlowBuilder /></TabsContent>
        <TabsContent value="viewflows"><ViewFlows /></TabsContent>
      </Tabs>
    </div>
  );
}