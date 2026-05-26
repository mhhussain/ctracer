import 'package:flutter/material.dart';

class DomainDeepDiveScreen extends StatelessWidget {
  final String domainId;
  const DomainDeepDiveScreen({super.key, required this.domainId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text('Domain Deep Dive: $domainId')));
  }
}
