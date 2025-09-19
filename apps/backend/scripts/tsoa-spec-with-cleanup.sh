#!/bin/bash

# Clean the Generated<> wrappers
echo "🧹 Cleaning Generated<> wrappers from db.d.ts..."
tsx -e "require('./src/utils/cleanDbTypes').cleanDbTypes()"

# Run TSOA spec generation
echo "📝 Generating TSOA spec..."
tsoa spec --basePath /api
TSOA_EXIT_CODE=$?

# Always restore the file, regardless of TSOA success/failure
echo "🔄 Restoring original db.d.ts content..."
tsx -e "require('./src/utils/cleanDbTypes').restoreDbTypes()"

# Exit with the same code as TSOA
exit $TSOA_EXIT_CODE



