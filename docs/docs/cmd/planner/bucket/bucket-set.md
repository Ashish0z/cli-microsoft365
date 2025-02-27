# planner bucket set

Updates a Microsoft Planner bucket

## Usage

```sh
m365 planner bucket set [options]
```

## Options

`-i, --id [id]`
: ID of the bucket. Specify either `id` or `name` but not both.

`-n, --name [name]`
: Name of the bucket. Specify either `id` or `name` but not both.

`--planId [planId]`
: ID of the plan to update the bucket of. Specify either `planId` or `planTitle` when using `name`.

`--planTitle [planTitle]`
: Title of the plan to update the bucket of. Specify either `planId` or `planTitle` when using `name`. Always use in combination with either `ownerGroupId` or `ownerGroupName`. 

`--ownerGroupId [ownerGroupId]`
: ID of the group to which the plan belongs. Specify `ownerGroupId` or `ownerGroupName` when using `planTitle`.

`--ownerGroupName [ownerGroupName]`
: Name of the group to which the plan belongs. Specify `ownerGroupId` or `ownerGroupName` when using `planTitle`.

`--newName [newName]`
: New name of the bucket.

`--orderHint [orderHint]`
: Hint used to order items of this type in a list view. The format is defined as outlined [here](https://docs.microsoft.com/en-us/graph/api/resources/planner-order-hint-format?view=graph-rest-1.0).

--8<-- "docs/cmd/_global.md"

## Examples

Updates the Microsoft Planner bucket with ID _vncYUXCRBke28qMLB-d4xJcACtNz_

```sh
m365 planner bucket set --id "vncYUXCRBke28qMLB-d4xJcACtNz" --newName "New bucket name"
```

Updates the Microsoft Planner bucket named _My Bucket_ in the Plan _My Plan_ owned by group _My Group_

```sh
m365 planner bucket set --name "My Bucket" --planTitle "My Plan" --ownerGroupName "My Group" --newName "New bucket name"
```

Updates the Microsoft Planner bucket named _My Bucket_ in the Plan _My Plan_ owned by group with ID _00000000-0000-0000-0000-000000000000_

```sh
m365 planner bucket set --name "My Bucket" --planTitle "My Plan" --ownerGroupId 00000000-0000-0000-0000-000000000000 --newName "New bucket name"
```

## Response

The command won't return a response on success.
